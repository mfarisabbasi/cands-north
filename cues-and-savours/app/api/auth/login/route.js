import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import User from "@/backend/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectToDB();

    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user and include password field
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.username,
      user.accountType
    );

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          accountType: user.accountType,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to login" },
      { status: 500 }
    );
  }
}
