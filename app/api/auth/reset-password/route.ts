import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/auth/security";
import {
  getValidPasswordResetToken,
  markPasswordResetTokenUsed,
  resetUserPassword,
  getUserById
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Verify token
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const resetRecord = getValidPasswordResetToken(tokenHash);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = getUserById(resetRecord.userId);
    if (!user) {
      return NextResponse.json({ error: "User associated with this token not found." }, { status: 404 });
    }

    // Hash new password and update
    const { hash, salt } = hashPassword(password);
    const updated = resetUserPassword(user.id, hash, salt);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    markPasswordResetTokenUsed(resetRecord.id);

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in with your new password."
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
