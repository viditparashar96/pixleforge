import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        mfaEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already disabled" },
        { status: 400 }
      );
    }

    // Disable MFA and clear the secret
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        mfaSecret: null,
        mfaEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error("MFA disable error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}