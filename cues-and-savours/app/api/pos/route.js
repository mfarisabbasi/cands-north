import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import PosTransaction from "@/backend/models/PosTransaction";
import InventoryItem from "@/backend/models/InventoryItem";
import User from "@/backend/models/User";
import { getCurrentUser } from "@/lib/auth";
import Table from "@/backend/models/Table";
import Customer from "@/backend/models/Customer";

// GET /api/pos - Get all transactions
export async function GET() {
  try {
    await connectToDB();
    const transactions = await PosTransaction.find({})
      .sort({ createdAt: -1 })
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/pos - Create new transaction
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,
      tableId,
      customerId,
      total,
      status = "pending",
      customData: providedCustomData,
    } = body;

    await connectToDB();

    // Separate table billing items from regular inventory items
    const tableBillingItems = items.filter(
      (item) => item.itemId === "table-billing"
    );
    const inventoryItems = items.filter(
      (item) => item.itemId !== "table-billing"
    );

    let customData = providedCustomData || null;
    let calculatedTotal = 0;
    const processedItems = [];

    // Handle table billing data if present
    if (tableBillingItems.length > 0) {
      customData = { ...customData, ...tableBillingItems[0].customData };
    }

    // Process inventory items and validate stock
    for (const item of inventoryItems) {
      const inventoryItem = await InventoryItem.findById(item.itemId);
      if (!inventoryItem) {
        return NextResponse.json(
          { error: `Item not found: ${item.itemId}` },
          { status: 404 }
        );
      }

      // Check stock availability for stock-managed items
      const isStockManaged = inventoryItem.isStockManaged ?? true;
      if (isStockManaged) {
        const currentStock = inventoryItem.currentStock || 0;
        const requestedQuantity = item.quantity;

        if (currentStock < requestedQuantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${inventoryItem.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`,
            },
            { status: 400 }
          );
        }
      }

      // For split transactions with table billing, use the original price
      // but let the provided total override the calculation
      const priceAtTime = inventoryItem.price;

      processedItems.push({
        item: item.itemId,
        quantity: item.quantity,
        priceAtTime: priceAtTime,
      });

      calculatedTotal += priceAtTime * item.quantity;
    }

    // Determine which total to use
    let finalTotal;
    if (customData && customData.billing) {
      // For any transaction with table billing data, use the provided total
      // This handles both split transactions and regular table billing
      finalTotal = total;
    } else {
      // For pure inventory transactions, use calculated total or provided total
      finalTotal = total || calculatedTotal;
    }

    // Determine the creator of the transaction
    let transactionCreator = currentUser.userId; // Default to current user

    // If this transaction includes table billing and has startedBy info, use the original starter
    if (customData && customData.billing && customData.startedBy) {
      // Only use startedBy for table billing transactions, not person sales
      // Handle both ObjectId and populated object
      transactionCreator =
        typeof customData.startedBy === "string"
          ? customData.startedBy
          : customData.startedBy._id || customData.startedBy;
    }

    console.log("Creating POS transaction:", {
      processedItemsCount: processedItems.length,
      finalTotal,
      status,
      transactionCreator,
      hasCustomData: !!customData,
    });

    // Create the transaction with both table billing data and inventory items
    const transaction = await PosTransaction.create({
      items: processedItems, // Only actual inventory items (can be empty for table-only billing)
      table: tableId,
      customer: customerId || undefined,
      total: finalTotal,
      status,
      createdBy: transactionCreator, // Use the admin who started the session for table billing
      customData: customData, // Store table billing details if present
    });

    // Populate the response
    const populatedTransaction = await PosTransaction.findById(transaction._id)
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    return NextResponse.json(populatedTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
