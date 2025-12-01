import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import User from "@/backend/models/User";

// Default accounts to create
const defaultAccounts = [
  { username: "ali_vindhani", password: "12345678", accountType: "Owner" },
  { username: "shahaam", password: "12345678", accountType: "Management" },
  { username: "sami", password: "12345678", accountType: "Closer" },
  { username: "faris", password: "12345678", accountType: "Admin" },
];

export async function POST() {
  try {
    await connectToDB();

    // Check if any users exist
    const existingUsers = await User.countDocuments();

    if (existingUsers > 0) {
      // Clear existing users
      await User.deleteMany({});
    }

    // Create all default accounts
    const createdAccounts = [];
    for (const account of defaultAccounts) {
      const newUser = await User.create({
        username: account.username,
        accountType: account.accountType,
        password: account.password,
      });

      createdAccounts.push({
        username: newUser.username,
        accountType: newUser.accountType,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Default accounts created successfully",
        accounts: createdAccounts,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Setup accounts error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create default accounts",
      },
      { status: 500 }
    );
  }
}

