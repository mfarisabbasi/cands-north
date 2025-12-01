import { NextResponse } from "next/server";
import { connectToDB } from "@/backend/configs/database";
import Remaining from "@/backend/models/Remaining";
import { getCurrentUser } from "@/lib/auth";

// POST /api/remaining - Create new remaining balance record
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { remainingBalance, remainingOf } = body;

    await connectToDB();

    const remaining = await Remaining.create({
      remainingBalance,
      remainingOf,
      isCleared: false,
    });

    return NextResponse.json(remaining, { status: 201 });
  } catch (error) {
    console.error("Error creating remaining balance:", error);
    return NextResponse.json(
      { error: "Failed to create remaining balance" },
      { status: 500 }
    );
  }
}
