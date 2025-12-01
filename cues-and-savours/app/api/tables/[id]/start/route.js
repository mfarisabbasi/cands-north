import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Table from "@/backend/models/Table";
import { getCurrentUser } from "@/lib/auth";
import GameType from "@/backend/models/GameType";
import Customer from "@/backend/models/Customer";

// POST - Turn on table → starts timer, links customer
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();
    const { id } = await params;
    const body = await request.json();
    const { customerId, additionalPlayers, additionalControllers } = body;

    // Find the table
    const table = await Table.findById(id).populate("gameType");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Check if table is already on
    if (table.status === "on") {
      return NextResponse.json(
        { success: false, message: "Table is already active" },
        { status: 400 }
      );
    }

    // Check if any table with the same physical name is already active
    const existingActiveTable = await Table.findOne({
      name: table.name,
      status: "on",
      _id: { $ne: id }, // Exclude the current table
    });

    if (existingActiveTable) {
      return NextResponse.json(
        {
          success: false,
          message: `Table "${table.name}" is already in use under a different pricing scheme`,
        },
        { status: 400 }
      );
    }

    // Update table to start session
    table.status = "on";
    // Handle walk-in customer case - set to null if "walk-in" is selected
    table.currentCustomer =
      customerId && customerId !== "walk-in" ? customerId : null;
    table.startTime = new Date();
    table.endTime = null;
    table.totalCharge = 0;
    table.additionalPlayers = additionalPlayers || 0;
    table.additionalControllers = additionalControllers || 0;
    table.startedBy = currentUser.userId; // Store who started the session

    await table.save();

    // Populate customer data
    await table.populate("currentCustomer");

    return NextResponse.json({
      success: true,
      message: "Table started successfully",
      table,
    });
  } catch (error) {
    console.error("Error starting table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to start table",
      },
      { status: 500 }
    );
  }
}
