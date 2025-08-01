import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import speakeasy from "speakeasy";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a test secret
    const testSecret = speakeasy.generateSecret({
      name: "Test Account",
      issuer: "PixelForge Test",
      length: 32,
    });

    // Generate current token
    const currentTime = Math.floor(Date.now() / 1000);
    const currentToken = speakeasy.totp({
      secret: testSecret.base32,
      encoding: "base32",
      time: currentTime
    });

    // Test verification
    const isValid = speakeasy.totp.verify({
      secret: testSecret.base32,
      encoding: "base32",
      token: currentToken,
      window: 2
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: testSecret.base32,
        otpauth_url: testSecret.otpauth_url,
        currentToken,
        serverTime: new Date().toISOString(),
        unixTime: currentTime,
        verification: {
          isValid,
          token: currentToken
        },
        steps: {
          step1: "1. Copy the secret below",
          step2: "2. Add it manually to your authenticator app",
          step3: "3. Compare the generated token with the one below",
          step4: "4. They should match within 30 seconds"
        }
      }
    });
  } catch (error) {
    console.error("MFA test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}