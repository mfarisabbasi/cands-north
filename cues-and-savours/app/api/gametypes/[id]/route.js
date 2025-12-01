import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import GameType from "@/backend/models/GameType";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request, { params }) {
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

    // Only Owner and Management can update game types
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Find and update game type
    const updatedGameType = await GameType.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedGameType) {
      return NextResponse.json(
        { success: false, message: "Game type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Game type updated successfully",
        gameType: {
          id: updatedGameType._id.toString(), // Use 'id' for frontend consistency
          _id: updatedGameType._id.toString(), // Keep both for backward compatibility
          name: updatedGameType.name,
          chargeType: updatedGameType.chargeType,
          chargeAmount: updatedGameType.chargeAmount,
          includedControllers: updatedGameType.includedControllers,
          includedPlayers: updatedGameType.includedPlayers,
          additionalPersonCharge: updatedGameType.additionalPersonCharge,
          additionalControllerCharge:
            updatedGameType.additionalControllerCharge,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update game type error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, message: "Invalid game type ID format" },
        { status: 400 }
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: "Validation error: " + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update game type",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Only Owner and Management can delete game types
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate if ID is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Game type ID is required" },
        { status: 400 }
      );
    }

    // Check if the game type exists before deletion
    const gameType = await GameType.findById(id);
    if (!gameType) {
      return NextResponse.json(
        { success: false, message: "Game type not found" },
        { status: 404 }
      );
    }

    // TODO: Add check if game type is being used by any tables
    // const tablesUsingGameType = await Table.find({ gameType: id });
    // if (tablesUsingGameType.length > 0) {
    //   return NextResponse.json(
    //     { success: false, message: "Cannot delete game type. It is being used by active tables." },
    //     { status: 400 }
    //   );
    // }

    const deletedGameType = await GameType.findByIdAndDelete(id);

    if (!deletedGameType) {
      return NextResponse.json(
        { success: false, message: "Failed to delete game type" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Game type deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete game type error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, message: "Invalid game type ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete game type",
      },
      { status: 500 }
    );
  }
}
