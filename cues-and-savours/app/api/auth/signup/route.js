import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import User from "@/backend/models/User";
import { getCurrentUser, canCreateAccount } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectToDB();

    // Get current user from token
    const currentUser = await getCurrentUser();

    // Check if user is authenticated
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { username, accountType, password } = await request.json();

    // Validate input
    if (!username || !accountType || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to create this account type
    if (!canCreateAccount(currentUser, accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: `You don't have permission to create ${accountType} accounts`,
        },
        { status: 403 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Username already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = await User.create({
      username,
      accountType,
      password,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          accountType: newUser.accountType,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create account",
      },
      { status: 500 }
    );
  }
}
