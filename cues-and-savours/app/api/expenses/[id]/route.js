import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Expense from "@/backend/models/Expense";
import { getCurrentUser } from "@/lib/auth";

// GET /api/expenses/[id] - Get single expense
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedAccountTypes = ["Owner", "Management", "Admin"];
    if (!allowedAccountTypes.includes(currentUser.accountType)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectToDB();
    const { id } = await params;

    const expense = await Expense.findById(id).populate(
      "createdBy",
      "username accountType"
    );

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Update expense (Owner/Management only)
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Owner and Management can edit expenses
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        { error: "Only Owner and Management can edit expenses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, amount, note, category } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    await connectToDB();
    const { id } = await params;

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        amount: parseFloat(amount),
        note: note ? note.trim() : "",
        category: category || "Other",
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "username accountType");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense (Owner only)
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Owner can delete expenses
    if (currentUser.accountType !== "Owner") {
      return NextResponse.json(
        { error: "Only Owner can delete expenses" },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Expense deleted successfully",
      deletedExpense: expense,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
