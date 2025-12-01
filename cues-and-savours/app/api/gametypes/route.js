import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import GameType from "@/backend/models/GameType";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDB();

    // Get current user from token
    const currentUser = await getCurrentUser();

    // Check if user is authenticated and authorized
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Only Owner and Management can access game types
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Fetch all game types
    const gameTypes = await GameType.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        gameTypes: gameTypes.map((gt) => ({
          id: gt._id.toString(), // Use 'id' instead of '_id' for frontend consistency
          _id: gt._id.toString(), // Keep both for backward compatibility
          name: gt.name,
          chargeType: gt.chargeType,
          chargeAmount: gt.chargeAmount,
          includedControllers: gt.includedControllers,
          includedPlayers: gt.includedPlayers,
          additionalPersonCharge: gt.additionalPersonCharge,
          additionalControllerCharge: gt.additionalControllerCharge,
          createdAt: gt.createdAt,
          updatedAt: gt.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get game types error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch game types" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    // Get current user from token
    const currentUser = await getCurrentUser();

    // Check if user is authenticated and authorized
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Only Owner and Management can create game types
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.chargeType || data.chargeAmount === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, charge type, and charge amount are required",
        },
        { status: 400 }
      );
    }

    // Create new game type
    const newGameType = await GameType.create(data);

    return NextResponse.json(
      {
        success: true,
        message: "Game type created successfully",
        gameType: {
          id: newGameType._id.toString(), // Use 'id' for frontend consistency
          _id: newGameType._id.toString(), // Keep both for backward compatibility
          name: newGameType.name,
          chargeType: newGameType.chargeType,
          chargeAmount: newGameType.chargeAmount,
          includedControllers: newGameType.includedControllers,
          includedPlayers: newGameType.includedPlayers,
          additionalPersonCharge: newGameType.additionalPersonCharge,
          additionalControllerCharge: newGameType.additionalControllerCharge,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create game type error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create game type",
      },
      { status: 500 }
    );
  }
}
