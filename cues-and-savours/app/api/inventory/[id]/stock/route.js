import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import InventoryItem from "@/backend/models/InventoryItem";
import StockMovement from "@/backend/models/StockMovement";
import { getCurrentUser } from "@/lib/auth";

// POST /api/inventory/[id]/stock - Adjust stock (add or remove)
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user has permission
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { type, quantity, reason } = body;

    // Validate inputs
    if (!type || !["stock_in", "stock_out", "adjustment"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid stock movement type" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason is required for stock adjustments" },
        { status: 400 }
      );
    }

    await connectToDB();

    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if stock is managed for this item
    if (!item.isStockManaged) {
      return NextResponse.json(
        { error: "Stock is not managed for this item" },
        { status: 400 }
      );
    }

    const previousStock = item.currentStock || 0;
    let newStock;

    // Calculate new stock based on type
    if (type === "stock_in") {
      newStock = previousStock + quantity;
    } else if (type === "stock_out") {
      newStock = Math.max(0, previousStock - quantity);
      if (previousStock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock. Available: ${previousStock}, Requested: ${quantity}`,
          },
          { status: 400 }
        );
      }
    } else if (type === "adjustment") {
      // For adjustment, quantity is the new total stock
      newStock = quantity;
    }

    // Update inventory stock
    item.currentStock = newStock;
    await item.save();

    // Create stock movement record
    const stockMovement = await StockMovement.create({
      item: item._id,
      type,
      quantity:
        type === "adjustment" ? Math.abs(newStock - previousStock) : quantity,
      previousStock,
      newStock,
      balanceAfter: newStock,
      reason,
      reference: `Manual ${type} by ${currentUser.username}`,
      updatedBy: currentUser.userId,
    });

    // Populate the stock movement
    const populatedMovement = await StockMovement.findById(stockMovement._id)
      .populate("item", "name unit")
      .populate("updatedBy", "username");

    return NextResponse.json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
      },
      movement: populatedMovement,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}

// GET /api/inventory/[id]/stock - Get stock movement history for an item
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDB();

    const movements = await StockMovement.find({ item: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("updatedBy", "username")
      .populate("item", "name unit");

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}
