import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Table from "@/backend/models/Table";
import { getCurrentUser } from "@/lib/auth";

// PUT - Edit table details (Owner & Management only)
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Owner or Management)
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to edit tables",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;
    const body = await request.json();
    const { name, gameType } = body;

    if (!name || !gameType) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and game type are required",
        },
        { status: 400 }
      );
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { name, gameType },
      { new: true, runValidators: true }
    ).populate("gameType");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update table",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update table additional players/controllers (Admin operations)
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Admin operations during active sessions)
    if (!["Owner", "Management", "Admin"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to modify tables",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;
    const body = await request.json();

    // Only allow updating additionalPlayers and additionalControllers
    const updateData = {};
    if (body.additionalPlayers !== undefined) {
      updateData.additionalPlayers = Math.max(
        0,
        parseInt(body.additionalPlayers) || 0
      );
    }
    if (body.additionalControllers !== undefined) {
      updateData.additionalControllers = Math.max(
        0,
        parseInt(body.additionalControllers) || 0
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields to update",
        },
        { status: 400 }
      );
    }

    const table = await Table.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("gameType")
      .populate("startedBy", "username");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update table",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete table (Owner & Management only)
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Owner or Management)
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to delete tables",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;

    // Check if table is currently active
    const existingTable = await Table.findById(id);
    if (!existingTable) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    if (existingTable.status === "on") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete an active table. Please stop it first.",
        },
        { status: 400 }
      );
    }

    await Table.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete table",
      },
      { status: 500 }
    );
  }
}
