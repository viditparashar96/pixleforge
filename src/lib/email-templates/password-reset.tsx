import React from "react";

interface PasswordResetEmailProps {
  userName: string;
  userEmail: string;
  resetUrl: string;
  expirationTime?: string;
}

export const PasswordResetEmailTemplate: React.FC<PasswordResetEmailProps> = ({
  userName,
  userEmail,
  resetUrl,
  expirationTime = "1 hour",
}) => {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: "1.6",
        color: "#333",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "32px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: "0 0 8px 0",
            }}
          >
            Reset Your Password
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: "0",
            }}
          >
            PixelForge Nexus - Game Development Project Management
          </p>
        </div>

        {/* Body */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>
            Hi {userName},
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>
            We received a request to reset the password for your PixelForge
            Nexus account ({userEmail}).
          </p>
          <p style={{ fontSize: "16px", marginBottom: "24px" }}>
            Click the button below to reset your password. This link will expire
            in {expirationTime}.
          </p>
        </div>

        {/* Reset Button */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a
            href={resetUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Reset Password
          </a>
        </div>

        {/* Alternative Link */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}
          >
            If the button above doesn&apos;t work, copy and paste this link into
            your browser:
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#3b82f6",
              wordBreak: "break-all",
              backgroundColor: "#f3f4f6",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            {resetUrl}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "24px",
          }}
        >
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}
          >
            If you didn&apos;t request this password reset, you can safely
            ignore this email. Your password will remain unchanged.
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
            This email was sent to {userEmail} from PixelForge Nexus.
          </p>
        </div>
      </div>
    </div>
  );
};

export const generatePasswordResetEmailHTML = (
  props: PasswordResetEmailProps
): string => {
  const { userName, userEmail, resetUrl, expirationTime = "1 hour" } = props;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your PixelForge Nexus Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">
        Reset Your Password
      </h1>
      <p style="font-size: 16px; color: #6b7280; margin: 0;">
        PixelForge Nexus - Game Development Project Management
      </p>
    </div>

    <!-- Body -->
    <div style="margin-bottom: 32px;">
      <p style="font-size: 16px; margin-bottom: 16px;">
        Hi ${userName},
      </p>
      <p style="font-size: 16px; margin-bottom: 16px;">
        We received a request to reset the password for your PixelForge Nexus account (${userEmail}).
      </p>
      <p style="font-size: 16px; margin-bottom: 24px;">
        Click the button below to reset your password. This link will expire in ${expirationTime}.
      </p>
    </div>

    <!-- Reset Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a
        href="${resetUrl}"
        style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;"
      >
        Reset Password
      </a>
    </div>

    <!-- Alternative Link -->
    <div style="margin-bottom: 32px;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background-color: #f3f4f6; padding: 8px; border-radius: 4px;">
        ${resetUrl}
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        This email was sent to ${userEmail} from PixelForge Nexus.
      </p>
    </div>
  </div>

</body>
</html>
  `.trim();
};
