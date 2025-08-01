import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, secret } = await request.json();

    console.log('MFA Verification Request:', {
      userId: session.user.id,
      tokenProvided: !!token,
      tokenLength: token?.length,
      secretProvided: !!secret,
      secretLength: secret?.length,
      timestamp: new Date().toISOString()
    });

    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token and secret are required" },
        { status: 400 }
      );
    }

    // Clean the token (remove spaces, ensure numeric)
    const cleanToken = token.toString().replace(/\s+/g, '');
    
    console.log('Token details:', {
      original: token,
      cleaned: cleanToken,
      isNumeric: /^\d{6}$/.test(cleanToken)
    });

    if (!/^\d{6}$/.test(cleanToken)) {
      console.log('Invalid token format');
      return NextResponse.json(
        { error: "Token must be 6 digits" },
        { status: 400 }
      );
    }

    // Simple token verification like the Medium article
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: cleanToken,
      window: 2, // Allow some time drift
    });

    // Generate current token for debugging (simplified)
    const currentToken = speakeasy.totp({
      secret,
      encoding: "base32"
    });

    console.log('Verification attempt:', {
      provided: cleanToken,
      expected: currentToken,
      verified,
      serverTime: new Date().toISOString()
    });

    console.log('Verification result:', {
      verified,
      secret: secret.substring(0, 8) + '...', // Log partial secret for debugging
      providedToken: cleanToken
    });

    if (!verified) {
      return NextResponse.json(
        { 
          error: "Invalid verification code",
          debug: {
            expected: currentToken,
            provided: cleanToken,
            serverTime: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    // Save the secret and enable MFA
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        mfaSecret: secret,
        mfaEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}