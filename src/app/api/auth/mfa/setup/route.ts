import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

// Generate backup codes
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

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
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret - simplified approach like the Medium article
    const secret = speakeasy.generateSecret({
      name: `PixelForge Nexus (${user.email})`,
    });

    console.log('Generated MFA secret for user:', {
      userId: user.id,
      email: user.email,
      secretLength: secret.base32?.length,
      hasOtpAuthUrl: !!secret.otpauth_url
    });

    // Generate QR code using the built-in otpauth_url
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url || "");

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Simple test token generation (no custom parameters)
    const testToken = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32"
    });

    console.log('Test token generated:', {
      token: testToken,
      secret: secret.base32?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: `<img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 256px; max-height: 256px;" />`,
      backupCodes,
      manualEntryKey: secret.base32,
      debug: {
        testToken,
        otpAuthUrl: secret.otpauth_url
      }
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}