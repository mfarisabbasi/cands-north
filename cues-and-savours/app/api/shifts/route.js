import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Shift from "@/backend/models/Shift";
import { getCurrentUser } from "@/lib/auth";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// GET - View all shifts (paginated) - Owner, Closer, Management only
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission to view shifts
    if (!["Owner", "Closer", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only Owner, Closer, and Management can view shift data.",
        },
        { status: 403 }
      );
    }

    await connectToDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const adminName = searchParams.get("adminName");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build filter object
    const filter = {};

    if (adminName) {
      filter["admin.username"] = { $regex: adminName, $options: "i" };
    }

    if (startDate && endDate) {
      const start = dayjs(startDate).tz("Asia/Karachi").startOf("day").toDate();
      const end = dayjs(endDate).tz("Asia/Karachi").endOf("day").toDate();
      filter.startTime = { $gte: start, $lte: end };
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get shifts with pagination
    const shifts = await Shift.find(filter)
      .populate("admin", "username accountType")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalShifts = await Shift.countDocuments(filter);
    const totalPages = Math.ceil(totalShifts / limit);

    // Format shifts for response
    const formattedShifts = shifts.map((shift) => ({
      id: shift._id,
      admin: {
        id: shift.admin._id,
        username: shift.admin.username,
        accountType: shift.admin.accountType,
      },
      startTime: shift.startTime,
      endTime: shift.endTime,
      duration: shift.duration,
      formattedDuration: shift.formattedDuration,
      status: shift.status,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        shifts: formattedShifts,
        pagination: {
          currentPage: page,
          totalPages,
          totalShifts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get shifts error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch shifts",
      },
      { status: 500 }
    );
  }
}
