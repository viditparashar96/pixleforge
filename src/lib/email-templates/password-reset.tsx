import React from 'react';

interface PasswordResetEmailProps {
  userEmail: string;
  resetUrl: string;
  expirationTime?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userEmail,
  resetUrl,
  expirationTime = "1 hour"
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your PixelForge Nexus Password</title>
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '40px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#6366f1',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{
              margin: '0',
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827'
            }}>
              Reset Your Password
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '16px',
              color: '#6b7280'
            }}>
              PixelForge Nexus
            </p>
          </div>

          {/* Content */}
          <div style={{ marginBottom: '30px' }}>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              color: '#374151'
            }}>
              Hello,
            </p>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              color: '#374151'
            }}>
              We received a request to reset the password for your PixelForge Nexus account associated with <strong>{userEmail}</strong>.
            </p>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: '#374151'
            }}>
              Click the button below to reset your password:
            </p>

            {/* Reset Button */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <a
                href={resetUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reset Password
              </a>
            </div>

            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Or copy and paste this link into your browser:
            </p>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#6366f1',
              wordBreak: 'break-all',
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '4px'
            }}>
              {resetUrl}
            </p>

            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#ef4444'
            }}>
              ⚠️ This link will expire in {expirationTime}.
            </p>

            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              This email was sent by PixelForge Nexus
            </p>
            <p style={{
              margin: '0',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>

        {/* Footer outside the card */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '0 20px'
        }}>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            © 2024 PixelForge Nexus. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  );
};

// Export as plain HTML string for Resend
export const generatePasswordResetEmailHTML = (props: PasswordResetEmailProps): string => {
  const { userEmail, resetUrl, expirationTime = "1 hour" } = props;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your PixelForge Nexus Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background-color: #6366f1; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" stroke-width="2"/>
          <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Reset Your Password</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; color: #6b7280;">PixelForge Nexus</p>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 30px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello,</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">
        We received a request to reset the password for your PixelForge Nexus account associated with <strong>${userEmail}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">
        Click the button below to reset your password:
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
          Reset Password
        </a>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6366f1; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">
        ${resetUrl}
      </p>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #ef4444;">
        ⚠️ This link will expire in ${expirationTime}.
      </p>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
        This email was sent by PixelForge Nexus
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        If you have any questions, please contact our support team.
      </p>
    </div>
  </div>

  <!-- Footer outside the card -->
  <div style="text-align: center; margin-top: 20px; padding: 0 20px;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      © 2024 PixelForge Nexus. All rights reserved.
    </p>
  </div>
</body>
</html>`;
};