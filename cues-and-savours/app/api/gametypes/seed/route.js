import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import GameType from "@/backend/models/GameType";

const defaultGameTypes = [
  {
    name: "Snooker",
    chargeType: "Per Minute",
    chargeAmount: 8,
    includedControllers: 0,
    includedPlayers: 0,
    additionalPersonCharge: 0,
    additionalControllerCharge: 0,
  },
  {
    name: "Premium Snooker",
    chargeType: "Per Minute",
    chargeAmount: 9,
    includedControllers: 0,
    includedPlayers: 0,
    additionalPersonCharge: 0,
    additionalControllerCharge: 0,
  },
  {
    name: "Pool",
    chargeType: "Per Minute",
    chargeAmount: 7,
    includedControllers: 0,
    includedPlayers: 0,
    additionalPersonCharge: 0,
    additionalControllerCharge: 0,
  },
  {
    name: "Table Tennis (Per Half Hour)",
    chargeType: "Per Half Hour",
    chargeAmount: 400,
    includedControllers: 0,
    includedPlayers: 0,
    additionalPersonCharge: 0,
    additionalControllerCharge: 0,
  },
  {
    name: "Table Tennis (Per Hour)",
    chargeType: "Per Hour",
    chargeAmount: 600,
    includedControllers: 0,
    includedPlayers: 0,
    additionalPersonCharge: 0,
    additionalControllerCharge: 0,
  },
  {
    name: "Playstation 5 Premium Lounge",
    chargeType: "Per Hour",
    chargeAmount: 1200,
    includedControllers: 2,
    includedPlayers: 4,
    additionalPersonCharge: 100,
    additionalControllerCharge: 150,
  },
  {
    name: "Playstation 5 Basic",
    chargeType: "Per Hour",
    chargeAmount: 800,
    includedControllers: 2,
    includedPlayers: 2,
    additionalPersonCharge: 100,
    additionalControllerCharge: 150,
  },
];

export async function POST() {
  try {
    await connectToDB();

    // Check if game types already exist
    const existingCount = await GameType.countDocuments();

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Game types already exist",
          count: existingCount,
        },
        { status: 200 }
      );
    }

    // Insert default game types
    await GameType.insertMany(defaultGameTypes);

    return NextResponse.json(
      {
        success: true,
        message: "Default game types seeded successfully",
        count: defaultGameTypes.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed game types error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed game types" },
      { status: 500 }
    );
  }
}
