"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Shield, 
  Palette,
  Trash2
} from "lucide-react";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";
import { PreferencesSettings } from "./preferences-settings";
import { AccountSettings } from "./account-settings";

type SettingsTab = "profile" | "security" | "preferences" | "account";

const settingsTabs = [
  {
    id: "profile" as const,
    label: "Profile",
    icon: User,
    description: "Manage your personal information"
  },
  {
    id: "security" as const,
    label: "Security",
    icon: Shield,
    description: "Password and two-factor authentication"
  },
  {
    id: "preferences" as const,
    label: "Preferences",
    icon: Palette,
    description: "Theme, notifications, and display settings"
  },
  {
    id: "account" as const,
    label: "Account",
    icon: Trash2,
    description: "Account management and data export"
  }
];

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "security":
        return <SecuritySettings />;
      case "preferences":
        return <PreferencesSettings />;
      case "account":
        return <AccountSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start h-auto p-3",
                    activeTab === tab.id && "bg-muted"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-muted-foreground lg:block hidden">
                      {tab.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}