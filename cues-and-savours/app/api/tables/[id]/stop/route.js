import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Table from "@/backend/models/Table";
import { getCurrentUser } from "@/lib/auth";
import GameType from "@/backend/models/GameType";
import Customer from "@/backend/models/Customer";

// GET - Calculate billing without stopping the table
export async function GET(request, { params }) {
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

    // Find the table with populated gameType
    const table = await Table.findById(id)
      .populate("gameType")
      .populate("currentCustomer");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Check if table is active
    if (table.status === "off") {
      return NextResponse.json(
        { success: false, message: "Table is already inactive" },
        { status: 400 }
      );
    }

    // Calculate total charge
    const endTime = new Date();
    const startTime = table.startTime;
    const durationInMinutes = Math.ceil((endTime - startTime) / (1000 * 60));

    let baseCharge = 0;
    const gameType = table.gameType;

    // Calculate base charge based on charge type
    switch (gameType.chargeType) {
      case "Per Minute":
        baseCharge = durationInMinutes * gameType.chargeAmount;
        break;
      case "Per Half Hour":
        const halfHours = Math.ceil(durationInMinutes / 30);
        baseCharge = halfHours * gameType.chargeAmount;
        break;
      case "Per Hour":
        const hours = Math.ceil(durationInMinutes / 60);
        baseCharge = hours * gameType.chargeAmount;
        break;
      case "Flexible":
        // Flexible pricing logic
        const thresholdMinutes =
          gameType.flexiblePricing?.thresholdMinutes || 40;
        if (durationInMinutes <= thresholdMinutes) {
          baseCharge = gameType.flexiblePricing?.halfHourRate || 0;
        } else {
          // Calculate based on total hours for sessions longer than threshold
          const totalHours = Math.ceil(durationInMinutes / 60);
          baseCharge = totalHours * (gameType.flexiblePricing?.hourRate || 0);
        }
        break;
      default:
        baseCharge = 0;
    }

    // Calculate additional charges
    const additionalPlayerCharge =
      table.additionalPlayers * gameType.additionalPersonCharge;
    const additionalControllerCharge =
      table.additionalControllers * gameType.additionalControllerCharge;

    const totalCharge =
      baseCharge + additionalPlayerCharge + additionalControllerCharge;

    return NextResponse.json({
      success: true,
      message: "Billing calculated successfully",
      table,
      billing: {
        duration: durationInMinutes,
        baseCharge,
        additionalPlayerCharge,
        additionalControllerCharge,
        totalCharge,
        startTime,
        endTime,
      },
    });
  } catch (error) {
    console.error("Error calculating billing:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to calculate billing",
      },
      { status: 500 }
    );
  }
}

// POST - Turn off table → stops timer, calculates total charge
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

    // Find the table with populated gameType
    const table = await Table.findById(id)
      .populate("gameType")
      .populate("currentCustomer");

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Check if table is already off
    if (table.status === "off") {
      return NextResponse.json(
        { success: false, message: "Table is already inactive" },
        { status: 400 }
      );
    }

    // Calculate total charge
    const endTime = new Date();
    const startTime = table.startTime;
    const durationInMinutes = Math.ceil((endTime - startTime) / (1000 * 60));

    let baseCharge = 0;
    const gameType = table.gameType;

    // Calculate base charge based on charge type
    switch (gameType.chargeType) {
      case "Per Minute":
        baseCharge = durationInMinutes * gameType.chargeAmount;
        break;
      case "Per Half Hour":
        const halfHours = Math.ceil(durationInMinutes / 30);
        baseCharge = halfHours * gameType.chargeAmount;
        break;
      case "Per Hour":
        const hours = Math.ceil(durationInMinutes / 60);
        baseCharge = hours * gameType.chargeAmount;
        break;
      case "Flexible":
        // Flexible pricing logic
        const thresholdMinutes =
          gameType.flexiblePricing?.thresholdMinutes || 40;
        if (durationInMinutes <= thresholdMinutes) {
          baseCharge = gameType.flexiblePricing?.halfHourRate || 0;
        } else {
          // Calculate based on total hours for sessions longer than threshold
          const totalHours = Math.ceil(durationInMinutes / 60);
          baseCharge = totalHours * (gameType.flexiblePricing?.hourRate || 0);
        }
        break;
      default:
        baseCharge = 0;
    }

    // Calculate additional charges
    const additionalPlayerCharge =
      table.additionalPlayers * gameType.additionalPersonCharge;
    const additionalControllerCharge =
      table.additionalControllers * gameType.additionalControllerCharge;

    const totalCharge =
      baseCharge + additionalPlayerCharge + additionalControllerCharge;

    // Update table to stop session
    table.status = "off";
    table.endTime = endTime;
    table.totalCharge = totalCharge;

    await table.save();

    return NextResponse.json({
      success: true,
      message: "Table stopped successfully",
      table,
      billing: {
        duration: durationInMinutes,
        baseCharge,
        additionalPlayerCharge,
        additionalControllerCharge,
        totalCharge,
      },
    });
  } catch (error) {
    console.error("Error stopping table:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to stop table",
      },
      { status: 500 }
    );
  }
}
