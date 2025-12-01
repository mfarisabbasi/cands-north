import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Shift from "@/backend/models/Shift";
import { getCurrentUser } from "@/lib/auth";
import User from "@/backend/models/User";

// GET - Get current active shift for logged-in admin
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

    // Find active shift for this admin
    const activeShift = await Shift.findOne({
      admin: currentUser.userId,
      status: "active",
    }).populate("admin", "username accountType");

    if (!activeShift) {
      return NextResponse.json(
        {
          success: true,
          hasActiveShift: false,
          shift: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        hasActiveShift: true,
        shift: {
          id: activeShift._id,
          admin: activeShift.admin,
          startTime: activeShift.startTime,
          status: activeShift.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current shift error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to get current shift",
      },
      { status: 500 }
    );
  }
}
