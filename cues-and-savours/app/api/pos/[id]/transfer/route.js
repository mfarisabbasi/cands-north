import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import PosTransaction from "@/backend/models/PosTransaction";
import Customer from "@/backend/models/Customer";
import { getCurrentUser } from "@/lib/auth";

// POST /api/pos/[id]/transfer - Split/transfer part of a pending transaction to another customer
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { toCustomerId, amount } = body;

    if (!toCustomerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid customer ID and amount are required" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Find the original transaction
    const originalTransaction = await PosTransaction.findById(id)
      .populate("customer", "name")
      .populate("table", "name")
      .populate("createdBy", "username");

    if (!originalTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (originalTransaction.status !== "pending") {
      return NextResponse.json(
        { error: "Can only transfer pending transactions" },
        { status: 400 }
      );
    }

    if (amount > originalTransaction.total) {
      return NextResponse.json(
        { error: "Transfer amount cannot exceed total bill" },
        { status: 400 }
      );
    }

    // Verify target customer exists
    const targetCustomer = await Customer.findById(toCustomerId);
    if (!targetCustomer) {
      return NextResponse.json(
        { error: "Target customer not found" },
        { status: 404 }
      );
    }

    // Calculate remaining amount
    const remainingAmount = originalTransaction.total - amount;
    const isFullTransfer = amount === originalTransaction.total;

    if (isFullTransfer) {
      // For full transfer, just update the customer of the original transaction
      originalTransaction.customer = toCustomerId;
      if (!originalTransaction.customData) {
        originalTransaction.customData = {};
      }
      originalTransaction.customData = {
        ...originalTransaction.customData,
        transferType: "full",
        originalCustomer: originalTransaction.customer,
      };
      await originalTransaction.save();

      // Return the updated transaction
      const populatedTransaction = await PosTransaction.findById(
        originalTransaction._id
      )
        .populate("items.item", "name price")
        .populate("table", "name")
        .populate("customer", "name")
        .populate("createdBy", "username");

      return NextResponse.json({
        success: true,
        message: `Full bill transferred to ${targetCustomer.name}`,
        transactions: [populatedTransaction],
        originalId: id,
        isFullTransfer: true,
      });
    }

    // Calculate proportional items for each transaction (partial transfer)
    const proportionTransferred = amount / originalTransaction.total;
    const proportionRemaining = remainingAmount / originalTransaction.total;

    // Split items proportionally
    const transferredItems = originalTransaction.items.map((item) => ({
      item: item.item,
      quantity: parseFloat((item.quantity * proportionTransferred).toFixed(3)),
      priceAtTime: item.priceAtTime,
    }));

    const remainingItems = originalTransaction.items.map((item) => ({
      item: item.item,
      quantity: parseFloat((item.quantity * proportionRemaining).toFixed(3)),
      priceAtTime: item.priceAtTime,
    }));

    // Create new transaction for the transferred amount
    const newTransferredTransaction = await PosTransaction.create({
      items: transferredItems,
      table: originalTransaction.table,
      customer: toCustomerId,
      total: amount,
      status: "pending",
      createdBy: currentUser.userId,
      customData: {
        ...originalTransaction.customData,
        transferredFrom: originalTransaction._id,
        transferType: "split",
        originalAmount: originalTransaction.total,
      },
    });

    // Update original transaction with remaining amount and items
    originalTransaction.total = remainingAmount;
    originalTransaction.items = remainingItems;
    if (!originalTransaction.customData) {
      originalTransaction.customData = {};
    }
    originalTransaction.customData = {
      ...originalTransaction.customData,
      transferredTo: newTransferredTransaction._id,
      transferType: "split",
      originalAmount: originalTransaction.total + amount,
    };
    await originalTransaction.save();

    // Populate both transactions for response
    const populatedTransferredTransaction = await PosTransaction.findById(
      newTransferredTransaction._id
    )
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    const populatedRemainingTransaction = await PosTransaction.findById(
      originalTransaction._id
    )
      .populate("items.item", "name price")
      .populate("table", "name")
      .populate("customer", "name")
      .populate("createdBy", "username");

    return NextResponse.json({
      success: true,
      message: `Bill split successfully: Rs${amount} transferred to ${targetCustomer.name}`,
      transactions: [
        populatedTransferredTransaction,
        populatedRemainingTransaction,
      ],
      originalId: id,
    });
  } catch (error) {
    console.error("Error transferring transaction:", error);
    return NextResponse.json(
      { error: "Failed to transfer transaction" },
      { status: 500 }
    );
  }
}
