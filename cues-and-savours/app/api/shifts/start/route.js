import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Shift from "@/backend/models/Shift";
import { getCurrentUser } from "@/lib/auth";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import User from "@/backend/models/User";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// POST - Start shift for logged-in admin
export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (currentUser.accountType !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Only admins can start shifts" },
        { status: 403 }
      );
    }

    await connectToDB();

    // Check if admin already has an active shift
    const existingActiveShift = await Shift.findOne({
      admin: currentUser.userId,
      status: "active",
    });

    if (existingActiveShift) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have an active shift. Please end it before starting a new one.",
        },
        { status: 400 }
      );
    }

    // Get current time in Pakistan Standard Time (UTC+5)
    const pakistanTime = dayjs().tz("Asia/Karachi");

    // Create new shift
    const shift = new Shift({
      admin: currentUser.userId,
      startTime: pakistanTime.toDate(),
      status: "active",
    });

    await shift.save();

    // Populate admin data for response
    await shift.populate("admin", "username accountType");

    return NextResponse.json(
      {
        success: true,
        message: "Shift started successfully",
        shift: {
          id: shift._id,
          admin: shift.admin,
          startTime: shift.startTime,
          status: shift.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Start shift error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to start shift",
      },
      { status: 500 }
    );
  }
}
