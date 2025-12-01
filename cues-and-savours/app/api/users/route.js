import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import User from "@/backend/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
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

    // Fetch all users (excluding password)
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        users: users.map((user) => ({
          id: user._id.toString(),
          username: user.username,
          accountType: user.accountType,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        currentUser: {
          id: currentUser.userId,
          username: currentUser.username,
          accountType: currentUser.accountType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
