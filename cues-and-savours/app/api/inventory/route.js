import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import InventoryItem from "@/backend/models/InventoryItem";

// GET /api/inventory - Get all inventory items
export async function GET() {
  try {
    await connectToDB();
    const items = await InventoryItem.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user has permission
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    await connectToDB();
    const newItem = await InventoryItem.create({
      ...body,
      createdBy: currentUser._id,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
