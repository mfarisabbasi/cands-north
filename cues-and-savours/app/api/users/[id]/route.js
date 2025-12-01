import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import User from "@/backend/models/User";
import { getCurrentUser, canManageAccount } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const { username, accountType, password } = await request.json();

    // Find the target user
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if current user has permission to manage this account
    if (!canManageAccount(currentUser, targetUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to edit this account",
        },
        { status: 403 }
      );
    }

    // If changing account type, verify permission for new type
    if (accountType && accountType !== targetUser.accountType) {
      if (!canManageAccount(currentUser, accountType)) {
        return NextResponse.json(
          {
            success: false,
            message: `You don't have permission to change account type to ${accountType}`,
          },
          { status: 403 }
        );
      }
    }

    // Check if new username is already taken by another user
    if (username && username !== targetUser.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== id) {
        return NextResponse.json(
          { success: false, message: "Username already exists" },
          { status: 400 }
        );
      }
      targetUser.username = username;
    }

    // Update account type if provided
    if (accountType) {
      targetUser.accountType = accountType;
    }

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      targetUser.password = await bcrypt.hash(password, salt);
    }

    await targetUser.save();

    return NextResponse.json(
      {
        success: true,
        message: "Account updated successfully",
        user: {
          id: targetUser._id,
          username: targetUser.username,
          accountType: targetUser.accountType,
          updatedAt: targetUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Find the target user
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if current user has permission to delete this account
    if (!canManageAccount(currentUser, targetUser.accountType)) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to delete this account",
        },
        { status: 403 }
      );
    }

    // Prevent user from deleting themselves
    if (currentUser.userId === id) {
      return NextResponse.json(
        { success: false, message: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
