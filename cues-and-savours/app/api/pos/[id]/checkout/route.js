import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import PosTransaction from "@/backend/models/PosTransaction";
import InventoryItem from "@/backend/models/InventoryItem";
import StockMovement from "@/backend/models/StockMovement";
import { getCurrentUser } from "@/lib/auth";

// PUT /api/pos/[id]/checkout - Complete a transaction checkout
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDB();

    const transaction = await PosTransaction.findById(id).populate(
      "items.item"
    );
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status === "completed") {
      return NextResponse.json(
        { error: "Transaction already completed" },
        { status: 400 }
      );
    }

    // Check stock availability for all items before processing
    const stockErrors = [];
    for (const transactionItem of transaction.items) {
      const inventoryItem = await InventoryItem.findById(
        transactionItem.item._id
      );

      if (inventoryItem && inventoryItem.isStockManaged !== false) {
        const currentStock = inventoryItem.currentStock || 0;
        const requiredQuantity = transactionItem.quantity;

        if (currentStock < requiredQuantity) {
          stockErrors.push({
            item: inventoryItem.name,
            required: requiredQuantity,
            available: currentStock,
          });
        }
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          stockErrors: stockErrors,
        },
        { status: 400 }
      );
    }

    // Process stock deductions and create stock movements
    for (const transactionItem of transaction.items) {
      const inventoryItem = await InventoryItem.findById(
        transactionItem.item._id
      );

      // Only update stock for stock-managed items
      if (inventoryItem && inventoryItem.isStockManaged !== false) {
        const previousStock = inventoryItem.currentStock || 0;
        const soldQuantity = transactionItem.quantity;
        const newStock = Math.max(0, previousStock - soldQuantity);

        // Update inventory stock
        inventoryItem.currentStock = newStock;
        await inventoryItem.save();

        // Create stock movement record
        await StockMovement.create({
          item: inventoryItem._id,
          type: "sale",
          quantity: soldQuantity,
          previousStock: previousStock,
          newStock: newStock,
          balanceAfter: newStock,
          reason: `Sale - Transaction ${transaction._id}`,
          reference: transaction._id.toString(),
          updatedBy: currentUser.userId,
        });
      }
    }

    transaction.status = "completed";
    await transaction.save();

    const populatedTransaction = await PosTransaction.findById(transaction._id)
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    return NextResponse.json({
      ...populatedTransaction.toObject(),
      shouldPrint: true, // Flag to trigger printing on client side
    });
  } catch (error) {
    console.error("Error completing transaction:", error);
    return NextResponse.json(
      { error: "Failed to complete transaction" },
      { status: 500 }
    );
  }
}
