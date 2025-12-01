import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Customer from "@/backend/models/Customer";
import { getCurrentUser } from "@/lib/auth";

// GET - Fetch all customers
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
    const customers = await Customer.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

// POST - Add new customer (Owner & Management only)
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();
    const body = await request.json();
    const { name, phone, notes } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      phone,
      notes: notes || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer added successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add customer",
      },
      { status: 500 }
    );
  }
}
