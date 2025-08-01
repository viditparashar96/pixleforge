"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  Smartphone,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  debug?: {
    testToken?: string;
    otpAuthUrl?: string;
  };
}

export function SecuritySettings() {
  const { data: session } = useSession();
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingMFA, setIsLoadingMFA] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check if user has MFA enabled
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const response = await fetch("/api/auth/mfa/status");
      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Failed to check MFA status:", error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    setIsLoadingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const setupMFA = async () => {
    setIsLoadingMFA(true);
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to setup MFA");
      }

      const data = await response.json();
      console.log("MFA Setup Data:", {
        hasSecret: !!data.secret,
        secretLength: data.secret?.length,
        hasQrCode: !!data.qrCode,
        hasBackupCodes: !!data.backupCodes,
        backupCodesCount: data.backupCodes?.length,
        debug: data.debug,
      });

      setMfaSetupData(data);
      setShowMFASetup(true);
    } catch (error) {
      console.error("MFA setup error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to setup MFA"
      );
    } finally {
      setIsLoadingMFA(false);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }

    console.log("Attempting MFA verification:", {
      code: verificationCode,
      codeLength: verificationCode.length,
      secret: mfaSetupData?.secret?.substring(0, 8) + "...",
      timestamp: new Date().toISOString(),
    });

    setIsLoadingMFA(true);
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: mfaSetupData?.secret,
        }),
      });

      const responseData = await response.json();
      console.log("MFA verification response:", responseData);

      if (!response.ok) {
        // Show debug info if available
        if (responseData.debug) {
          console.log("Debug info:", responseData.debug);
          toast.error(
            `Invalid code. Expected: ${responseData.debug.expected} | You entered: ${responseData.debug.provided}`
          );
        } else {
          toast.error(responseData.error || "Invalid verification code");
        }
        return;
      }

      setMfaEnabled(true);
      setShowMFASetup(false);
      setVerificationCode("");
      toast.success("Two-factor authentication enabled successfully");
    } catch (error) {
      console.error("MFA verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify code"
      );
    } finally {
      setIsLoadingMFA(false);
    }
  };

  const disableMFA = async () => {
    if (
      !confirm(
        "Are you sure you want to disable two-factor authentication? This will make your account less secure."
      )
    ) {
      return;
    }

    setIsLoadingMFA(true);
    try {
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disable MFA");
      }

      setMfaEnabled(false);
      toast.success("Two-factor authentication disabled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disable MFA"
      );
    } finally {
      setIsLoadingMFA(false);
    }
  };

  const copyBackupCodes = () => {
    if (mfaSetupData?.backupCodes) {
      navigator.clipboard.writeText(mfaSetupData.backupCodes.join("\n"));
      toast.success("Backup codes copied to clipboard");
    }
  };

  const downloadBackupCodes = () => {
    if (mfaSetupData?.backupCodes) {
      const content = `PixelForge Nexus - Two-Factor Authentication Backup Codes

Generated: ${new Date().toLocaleString()}
Account: ${session?.user?.email}

These backup codes can be used to access your account if you lose access to your authenticator app.
Each code can only be used once.

${mfaSetupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join("\n")}

Keep these codes safe and secure!`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pixelforge-backup-codes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup codes downloaded");
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter your current password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isLoadingPassword}>
              {isLoadingPassword ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
            {mfaEnabled && (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with two-factor
            authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaEnabled ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Two-factor authentication is disabled</AlertTitle>
                <AlertDescription>
                  Your account is more vulnerable without 2FA. Enable it now to
                  improve your security.
                </AlertDescription>
              </Alert>

              <Button onClick={setupMFA} disabled={isLoadingMFA}>
                {isLoadingMFA
                  ? "Setting up..."
                  : "Enable Two-Factor Authentication"}
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Two-factor authentication is enabled</AlertTitle>
                <AlertDescription>
                  Your account is protected with two-factor authentication.
                </AlertDescription>
              </Alert>

              <Button
                variant="destructive"
                onClick={disableMFA}
                disabled={isLoadingMFA}
              >
                {isLoadingMFA
                  ? "Disabling..."
                  : "Disable Two-Factor Authentication"}
              </Button>
            </>
          )}

          {/* MFA Setup Modal-like section */}
          {showMFASetup && mfaSetupData && (
            <div className="space-y-6 border rounded-lg p-6 bg-muted/20">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Set up Two-Factor Authentication
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code below with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </p>
              </div>

              <div className="flex justify-center">
                <div
                  className="bg-white p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: mfaSetupData.qrCode }}
                />
              </div>

              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={mfaSetupData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSetupData.secret);
                      toast.success("Secret copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this manually to your authenticator app if the QR code
                  doesn&apos;t work
                </p>
              </div>

              {/* Debug Info */}
              {/* {mfaSetupData.debug && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Debug Info
                  </Label>
                  <div className="text-xs font-mono space-y-1">
                    <div>Server Token: {mfaSetupData.debug.testToken}</div>
                    <div>Time: {new Date().toLocaleTimeString()}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your authenticator app should show this token within 30
                    seconds.
                  </p>
                </div>
              )} */}

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  className="text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              {/* Backup Codes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyBackupCodes}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                  {mfaSetupData.backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save these backup codes in a safe place. Each code can only be
                  used once.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={verifyAndEnableMFA}
                  disabled={isLoadingMFA || verificationCode.length !== 6}
                >
                  {isLoadingMFA ? "Verifying..." : "Verify & Enable"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMFASetup(false);
                    setMfaSetupData(null);
                    setVerificationCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
