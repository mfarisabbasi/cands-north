import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Table from "@/backend/models/Table";
import { getCurrentUser } from "@/lib/auth";
import GameType from "@/backend/models/GameType";
import Customer from "@/backend/models/Customer";

// GET - Fetch all tables with game type & current status
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();
    const tables = await Table.find()
      .populate("gameType")
      .populate("currentCustomer")
      .populate("startedBy", "username")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      tables,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch tables",
      },
      { status: 500 }
    );
  }
}

// POST - Add new table (Owner & Management only)
export async function POST(request) {
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
          message: "You don't have permission to add tables",
        },
        { status: 403 }
      );
    }

    await connectToDB();
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

    const table = await Table.create({
      name,
      gameType,
      status: "off",
    });

    const populatedTable = await Table.findById(table._id).populate("gameType");

    return NextResponse.json(
      {
        success: true,
        message: "Table added successfully",
        table: populatedTable,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add table",
      },
      { status: 500 }
    );
  }
}
