import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import PosTransaction from "@/backend/models/PosTransaction";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";
import Table from "@/backend/models/Table";
import User from "@/backend/models/User";
import GameType from "@/backend/models/GameType";
import Customer from "@/backend/models/Customer";
import InventoryItem from "@/backend/models/InventoryItem";

// GET /api/sales-data - Get sales data with filtering
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to sales data
    const allowedAccountTypes = ["Management", "Owner", "Closer"];
    if (!allowedAccountTypes.includes(currentUser.accountType)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectToDB();

    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const dateRange = searchParams.get("dateRange");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const adminId = searchParams.get("adminId");
    const gameTypeId = searchParams.get("gameTypeId");

    // Build filter object
    const filter = {};

    // Date filtering
    if (startDate && endDate) {
      // Custom date range
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      };
    } else if (dateRange) {
      const now = new Date();

      if (dateRange === "currentMonth") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        filter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
      } else if (dateRange === "lastMonth") {
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );
        filter.createdAt = { $gte: startOfLastMonth, $lte: endOfLastMonth };
      }
    }

    // Admin filtering
    if (adminId) {
      filter.createdBy = adminId;
    }

    // Game type filtering (complex because it can be in table.gameType or customData.gameType)
    let gameTypeFilter = {};
    if (gameTypeId) {
      // We need to use aggregation pipeline for this complex query
      const salesData = await PosTransaction.aggregate([
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByData",
          },
        },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerData",
          },
        },
        {
          $lookup: {
            from: "inventoryitems",
            localField: "items.item",
            foreignField: "_id",
            as: "itemsData",
          },
        },
        {
          $match: {
            ...filter,
            $or: [
              {
                "gameTypeData._id": {
                  $eq: new mongoose.Types.ObjectId(gameTypeId),
                },
              },
              { "customData.gameTypeId": gameTypeId },
            ],
          },
        },
        {
          $addFields: {
            table: { $arrayElemAt: ["$tableData", 0] },
            createdBy: { $arrayElemAt: ["$createdByData", 0] },
            customer: { $arrayElemAt: ["$customerData", 0] },
            gameType: {
              $cond: {
                if: { $gt: [{ $size: "$gameTypeData" }, 0] },
                then: { $arrayElemAt: ["$gameTypeData", 0] },
                else: null,
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1000 }, // Limit for performance
      ]);

      // Calculate summary stats for filtered data
      const totalSales = salesData.reduce(
        (sum, transaction) => sum + (transaction.total || 0),
        0
      );
      const totalTransactions = salesData.length;
      const averageTransaction =
        totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return NextResponse.json({
        salesData,
        summary: {
          totalSales,
          totalTransactions,
          averageTransaction,
        },
      });
    }

    // Regular query without game type filtering
    const salesData = await PosTransaction.find(filter)
      .populate("createdBy", "username accountType")
      .populate("customer", "name")
      .populate({
        path: "table",
        populate: {
          path: "gameType",
          model: "GameType",
        },
      })
      .populate("items.item", "name price")
      .sort({ createdAt: -1 })
      .limit(1000); // Limit for performance

    // Calculate summary statistics
    const totalSales = salesData.reduce(
      (sum, transaction) => sum + (transaction.total || 0),
      0
    );
    const totalTransactions = salesData.length;
    const averageTransaction =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return NextResponse.json({
      salesData,
      summary: {
        totalSales,
        totalTransactions,
        averageTransaction,
      },
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}
