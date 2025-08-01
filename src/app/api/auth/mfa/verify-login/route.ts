import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Clean the token (remove spaces, ensure numeric)
    const cleanToken = token.toString().replace(/\s+/g, '');
    
    if (!/^\d{6}$/.test(cleanToken)) {
      return NextResponse.json(
        { error: "Token must be 6 digits" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: cleanToken,
      window: 2, // Allow some time drift
    });

    if (!verified) {
      console.log('MFA verification failed:', {
        userId: user.id,
        email: user.email,
        providedToken: cleanToken,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Generate a temporary MFA token for NextAuth
    const mfaToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        mfaVerified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes expiry
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    );

    console.log('MFA verification successful:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      mfaToken,
      message: "MFA verification successful",
    });
  } catch (error) {
    console.error("MFA login verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}