"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ThemeSettingsPanel } from "@/components/ui/theme-settings-panel";
import { Globe, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast.success(`Language changed to ${value === "en" ? "English" : value}`);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    toast.success(`Timezone changed to ${value}`);
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the appearance of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <Button
                    key={themeOption.value}
                    variant={
                      theme === themeOption.value ? "default" : "outline"
                    }
                    className="h-20 flex-col gap-2"
                    onClick={() => setTheme(themeOption.value)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{themeOption.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Theme Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Advanced Theme Customization</Label>
                <p className="text-sm text-muted-foreground">
                  Fine-tune colors and visual elements
                </p>
              </div>
              <ThemeSettingsPanel />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={handleNotificationChange('email')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={handleNotificationChange('push')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-notifications">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security-related notifications
                </p>
              </div>
              <Switch
                id="security-notifications"
                checked={notifications.security}
                onCheckedChange={handleNotificationChange('security')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-notifications">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Product updates and promotional content
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={notifications.marketing}
                onCheckedChange={handleNotificationChange('marketing')}
              />
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">
                    Eastern Time (GMT-5)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (GMT-6)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (GMT-7)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (GMT-8)
                  </SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">
                    Shanghai (GMT+8)
                  </SelectItem>
                  <SelectItem value="Australia/Sydney">
                    Sydney (GMT+11)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Current time:{" "}
              {new Date().toLocaleString("en-US", { timeZone: timezone })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
