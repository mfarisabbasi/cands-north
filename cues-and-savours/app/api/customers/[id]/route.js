import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Customer from "@/backend/models/Customer";
import { getCurrentUser } from "@/lib/auth";

// PUT - Update customer (Owner & Management only)
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Owner or Management)
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to edit customers",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;
    const body = await request.json();
    const { name, phone, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and phone are required",
        },
        { status: 400 }
      );
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      { name, phone, notes },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update customer",
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove customer (Owner & Management only)
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission (Owner or Management)
    if (!["Owner", "Management"].includes(currentUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to delete customers",
        },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete customer",
      },
      { status: 500 }
    );
  }
}
