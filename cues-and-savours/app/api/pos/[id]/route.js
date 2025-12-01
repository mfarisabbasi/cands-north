import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import PosTransaction from "@/backend/models/PosTransaction";
import InventoryItem from "@/backend/models/InventoryItem";
import StockMovement from "@/backend/models/StockMovement";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/pos/[id] - Update transaction status
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    await connectToDB();

    // Validate status
    if (!["pending", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending' or 'completed'" },
        { status: 400 }
      );
    }

    // Find the current transaction to check its current status
    const currentTransaction = await PosTransaction.findById(id).populate(
      "items.item"
    );
    if (!currentTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const previousStatus = currentTransaction.status;

    // Handle stock changes based on status transitions
    if (previousStatus !== status) {
      if (previousStatus === "completed" && status === "pending") {
        // Restore stock when changing from completed to pending
        for (const transactionItem of currentTransaction.items) {
          const inventoryItem = await InventoryItem.findById(
            transactionItem.item._id
          );

          if (inventoryItem && inventoryItem.isStockManaged !== false) {
            const previousStock = inventoryItem.currentStock || 0;
            const returnedQuantity = transactionItem.quantity;
            const newStock = previousStock + returnedQuantity;

            // Update inventory stock
            inventoryItem.currentStock = newStock;
            await inventoryItem.save();

            // Create stock movement record
            await StockMovement.create({
              item: inventoryItem._id,
              type: "stock_in",
              quantity: returnedQuantity,
              previousStock: previousStock,
              newStock: newStock,
              balanceAfter: newStock,
              reason: `Sale reversal - Transaction ${currentTransaction._id}`,
              reference: currentTransaction._id.toString(),
              updatedBy: currentUser.userId,
            });
          }
        }
      } else if (previousStatus === "pending" && status === "completed") {
        // Deduct stock when changing from pending to completed (same logic as checkout)
        for (const transactionItem of currentTransaction.items) {
          const inventoryItem = await InventoryItem.findById(
            transactionItem.item._id
          );

          if (inventoryItem && inventoryItem.isStockManaged !== false) {
            const currentStock = inventoryItem.currentStock || 0;
            const requiredQuantity = transactionItem.quantity;

            if (currentStock < requiredQuantity) {
              return NextResponse.json(
                {
                  error: `Insufficient stock for ${inventoryItem.name}. Available: ${currentStock}, Required: ${requiredQuantity}`,
                },
                { status: 400 }
              );
            }

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
              reason: `Sale - Transaction ${currentTransaction._id}`,
              reference: currentTransaction._id.toString(),
              updatedBy: currentUser.userId,
            });
          }
        }
      }
    }

    // Find and update the transaction
    const transaction = await PosTransaction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Add flag to trigger printing if status changed to completed
    const response = transaction.toObject();
    if (status === "completed" && previousStatus !== "completed") {
      response.shouldPrint = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
