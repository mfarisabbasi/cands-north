import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
export function generateToken(userId, username, accountType) {
  return jwt.sign(
    {
      userId,
      username,
      accountType,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get current user from cookies
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token.value);

    return decoded;
  } catch (error) {
    return null;
  }
}

// Check if user has permission to perform action
export function canManageAccount(currentUser, targetAccountType) {
  if (!currentUser) return false;

  const { accountType } = currentUser;

  // Admin can only view, not manage
  if (accountType === "Admin") return false;

  // Only Owner can manage Owner accounts
  if (targetAccountType === "Owner" && accountType !== "Owner") {
    return false;
  }

  // Owner, Closer, and Management can manage other account types
  return ["Owner", "Closer", "Management"].includes(accountType);
}

// Check if user can create account of specific type
export function canCreateAccount(currentUser, newAccountType) {
  if (!currentUser) return false;

  const { accountType } = currentUser;

  // Admin cannot create accounts
  if (accountType === "Admin") return false;

  // Only Owner can create Owner accounts
  if (newAccountType === "Owner" && accountType !== "Owner") {
    return false;
  }

  // Owner, Closer, and Management can create other account types
  return ["Owner", "Closer", "Management"].includes(accountType);
}
