"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Database,
  Download,
  FileText,
  LogOut,
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function AccountSettings() {
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/account/export", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pixelforge-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Your data has been exported successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export data"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted successfully");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (
      !confirm(
        "Are you absolutely sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }
    setShowDeleteConfirm(true);
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your data from PixelForge Nexus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              What&apos;s included in your export:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Profile information and account details
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                Project data and assignments
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Document metadata (files not included)
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                Activity logs and timestamps
              </li>
            </ul>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Format</p>
              <p className="text-sm text-muted-foreground">
                JSON format with all your data
              </p>
            </div>
            <Button onClick={handleExportData} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Key details about your PixelForge Nexus account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Account ID</Label>
              <p className="font-mono">{session.user.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="capitalize">{session.user.role.toLowerCase()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Login</Label>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Status</Label>
              <p className="text-green-600 font-medium">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions and sign out from all devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out Everywhere</p>
              <p className="text-sm text-muted-foreground">
                This will sign you out from all devices and browsers
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Delete Account</AlertTitle>
            <AlertDescription>
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </AlertDescription>
          </Alert>

          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <div className="space-y-2">
                <Label
                  htmlFor="deleteConfirmation"
                  className="text-destructive font-medium"
                >
                  Type &quot;DELETE&quot; to confirm account deletion
                </Label>
                <Input
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE here"
                  className="border-destructive/50"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={
                    isDeletingAccount || deleteConfirmation !== "DELETE"
                  }
                >
                  {isDeletingAccount ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Permanently Delete Account
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation("");
                  }}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                This will permanently delete your account, all projects,
                documents, and associated data. Make sure to export your data
                first if needed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
