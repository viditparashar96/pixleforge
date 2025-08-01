"use server";

import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePasswordResetEmailHTML } from "@/lib/email-templates/password-reset";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const RequestPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export async function requestPasswordReset(email: string) {
  try {
    // Validate input
    const validatedData = RequestPasswordResetSchema.parse({ email });

    // Find user by email
    const user = await db.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase(),
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Generate secure random token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this user
    await db.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Create new password reset token
    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    // Send password reset email
    try {
      const res = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PixelForge Nexus <noreply@resend.dev>",
        to: [user.email],
        subject: "Reset Your PixelForge Nexus Password",
        html: generatePasswordResetEmailHTML({
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          resetUrl,
          expirationTime: "1 hour",
        }),
      });

      console.log(`Password reset email sent to ${user.email}`, res);
      // Log the response for debugging
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue with success response to prevent email enumeration
      // In production, you might want to implement retry logic or queue the email
    }

    return {
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("Request password reset error:", error);
    return {
      success: false,
      error: "Failed to process password reset request. Please try again.",
    };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    // Validate input
    const validatedData = ResetPasswordSchema.parse({ token, password });

    // Find valid token
    const resetToken = await db.passwordResetToken.findUnique({
      where: {
        token: validatedData.token,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      return {
        success: false,
        error: "Invalid or expired reset token.",
      };
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "Reset token has expired. Please request a new one.",
      };
    }

    // Check if token has been used
    if (resetToken.used) {
      return {
        success: false,
        error: "Reset token has already been used.",
      };
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password);

    // Update user password and mark token as used
    await db.$transaction([
      db.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
          updatedAt: new Date(),
        },
      }),
      db.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          used: true,
        },
      }),
    ]);

    return {
      success: true,
      message:
        "Password reset successfully. You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}

export async function verifyResetToken(token: string) {
  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: {
        token,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!resetToken) {
      return {
        success: false,
        error: "Invalid reset token.",
      };
    }

    if (resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "Reset token has expired.",
      };
    }

    if (resetToken.used) {
      return {
        success: false,
        error: "Reset token has already been used.",
      };
    }

    return {
      success: true,
      data: {
        email: resetToken.user.email,
      },
    };
  } catch (error) {
    console.error("Verify reset token error:", error);
    return {
      success: false,
      error: "Failed to verify reset token.",
    };
  }
}
