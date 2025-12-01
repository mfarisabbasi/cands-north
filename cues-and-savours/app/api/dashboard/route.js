import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";
import Shift from "@/backend/models/Shift";
import PosTransaction from "@/backend/models/PosTransaction";
import User from "@/backend/models/User";

// GET /api/dashboard - Get dashboard analytics data
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to dashboard
    const allowedAccountTypes = ["Management", "Owner", "Closer"];
    if (!allowedAccountTypes.includes(currentUser.accountType)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectToDB();

    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // 1. Today's Sales
    const todaysSales = await PosTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // 2. This Month's Sales
    const monthSales = await PosTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // 3. Active Admin (on shift right now)
    const activeAdmins = await Shift.find({
      status: "active",
    }).populate("admin", "username accountType");

    // 4. Top Game Types Today
    const topGameTypesToday = await PosTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          status: "completed",
        },
      },
      {
        $lookup: {
          from: "tables",
          localField: "table",
          foreignField: "_id",
          as: "tableData",
        },
      },
      {
        $lookup: {
          from: "gametypes",
          localField: "tableData.gameType",
          foreignField: "_id",
          as: "gameTypeData",
        },
      },
      {
        $unwind: {
          path: "$gameTypeData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            gameTypeId: "$gameTypeData._id",
            gameTypeName: {
              $ifNull: ["$gameTypeData.name", "$customData.gameType"],
            },
          },
          totalSales: { $sum: "$total" },
          totalSessions: { $sum: 1 },
        },
      },
      {
        $match: {
          "_id.gameTypeName": { $ne: null },
        },
      },
      {
        $project: {
          gameTypeName: "$_id.gameTypeName",
          totalSales: 1,
          totalSessions: 1,
        },
      },
      {
        $sort: { totalSales: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Prepare response data
    const dashboardData = {
      todaysSales: {
        amount: todaysSales[0]?.totalSales || 0,
        transactions: todaysSales[0]?.totalTransactions || 0,
      },
      monthSales: {
        amount: monthSales[0]?.totalSales || 0,
        transactions: monthSales[0]?.totalTransactions || 0,
      },
      activeAdmins: activeAdmins.map((shift) => ({
        id: shift.admin._id,
        username: shift.admin.username,
        accountType: shift.admin.accountType,
        startTime: shift.startTime,
      })),
      topGameTypesToday: topGameTypesToday,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
