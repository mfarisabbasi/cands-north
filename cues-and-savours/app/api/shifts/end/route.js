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

// POST - End active shift for logged-in admin
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
        { success: false, message: "Only admins can end shifts" },
        { status: 403 }
      );
    }

    await connectToDB();

    // Find active shift for this admin
    const activeShift = await Shift.findOne({
      admin: currentUser.userId,
      status: "active",
    });

    if (!activeShift) {
      return NextResponse.json(
        {
          success: false,
          message: "No active shift found to end",
        },
        { status: 404 }
      );
    }

    // Get current time in Pakistan Standard Time (UTC+5)
    const pakistanTime = dayjs().tz("Asia/Karachi");

    // Calculate duration in minutes
    const startTime = dayjs(activeShift.startTime);
    const endTime = pakistanTime;
    const durationMinutes = endTime.diff(startTime, "minute");

    // Update shift
    activeShift.endTime = pakistanTime.toDate();
    activeShift.status = "ended";
    activeShift.duration = durationMinutes;

    await activeShift.save();

    // Populate admin data for response
    await activeShift.populate("admin", "username accountType");

    return NextResponse.json(
      {
        success: true,
        message: "Shift ended successfully",
        shift: {
          id: activeShift._id,
          admin: activeShift.admin,
          startTime: activeShift.startTime,
          endTime: activeShift.endTime,
          duration: activeShift.duration,
          formattedDuration: activeShift.formattedDuration,
          status: activeShift.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("End shift error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to end shift",
      },
      { status: 500 }
    );
  }
}
