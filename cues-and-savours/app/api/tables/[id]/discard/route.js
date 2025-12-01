import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Table from "@/backend/models/Table";
import { getCurrentUser } from "@/lib/auth";

// POST - Discard table session (within 10 minutes only)
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Admin operations)
    if (!["Owner", "Management", "Admin"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to discard tables",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;
    const body = await request.json();
    const { reason, note } = body;

    // Find the table
    const table = await Table.findById(id).populate("gameType");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Check if table is active
    if (table.status === "off") {
      return NextResponse.json(
        { success: false, message: "Table is not active" },
        { status: 400 }
      );
    }

    // Check if session is within 10 minutes
    const now = new Date();
    const startTime = table.startTime;
    const durationInMinutes = Math.floor((now - startTime) / (1000 * 60));

    if (durationInMinutes >= 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot discard session after 10 minutes. Please use regular stop instead.",
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Reason is required for discarding" },
        { status: 400 }
      );
    }

    // Reset table to off state without creating any transaction
    const updatedTable = await Table.findByIdAndUpdate(
      id,
      {
        status: "off",
        currentCustomer: null,
        startTime: null,
        endTime: null,
        totalCharge: 0,
        additionalPlayers: 0,
        additionalControllers: 0,
        startedBy: null,
      },
      { new: true }
    ).populate("gameType");

    // Log the discard action (you might want to create a separate model for this)
    console.log(`Table ${table.name} discarded by ${currentUser.username}`, {
      reason,
      note,
      sessionDuration: durationInMinutes,
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Table session discarded successfully",
      table: updatedTable,
      discardInfo: {
        reason,
        note,
        sessionDuration: durationInMinutes,
        discardedBy: currentUser.username,
        discardedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error discarding table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to discard table",
      },
      { status: 500 }
    );
  }
}
