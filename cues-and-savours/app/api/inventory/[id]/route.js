import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import InventoryItem from "@/backend/models/InventoryItem";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// GET /api/inventory/[id] - Get single inventory item
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectToDB();
    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(request, { params }) {
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

    console.log("Update request for item:", id);
    console.log("Update data:", body);

    await connectToDB();

    // If isStockManaged is being set to false, clear stock-related fields
    const updateData = { ...body };
    if (updateData.isStockManaged === false) {
      updateData.currentStock = 0;
      updateData.lowStockThreshold = 0;
      updateData.unit = "";
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    console.log("Updated item:", updatedItem);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    // Check if user has permission
    if (!["Owner", "Management"].includes(user?.accountType)) {
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDB();
    const deletedItem = await InventoryItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    revalidatePath("/inventory");

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
