import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Expense from "@/backend/models/Expense";
import { getCurrentUser } from "@/lib/auth";

// GET /api/expenses - Get all expenses
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view expenses
    const allowedAccountTypes = ["Owner", "Management", "Admin"];
    if (!allowedAccountTypes.includes(currentUser.accountType)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectToDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter object
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    const expenses = await Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "username accountType");

    const totalExpenses = await Expense.countDocuments(filter);
    const totalAmount = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        current: page,
        total: Math.ceil(totalExpenses / limit),
        count: totalExpenses,
      },
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create expenses
    const allowedAccountTypes = ["Owner", "Management", "Admin"];
    if (!allowedAccountTypes.includes(currentUser.accountType)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, amount, note, category } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        { error: "Amount cannot be negative" },
        { status: 400 }
      );
    }

    await connectToDB();

    const expense = await Expense.create({
      title: title.trim(),
      amount: parseFloat(amount),
      note: note ? note.trim() : "",
      category: category || "Other",
      createdBy: currentUser.userId,
    });

    const populatedExpense = await Expense.findById(expense._id).populate(
      "createdBy",
      "username accountType"
    );

    return NextResponse.json(populatedExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
