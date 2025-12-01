import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// GET - Get current user from cookie
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: currentUser.userId,
          username: currentUser.username,
          accountType: currentUser.accountType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get user" },
      { status: 500 }
    );
  }
}
