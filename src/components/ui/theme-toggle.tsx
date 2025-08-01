"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeCustomization } from "@/lib/hooks/use-theme-customization";

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeNames = {
  electric: "⚡ Electric",
  ocean: "🌊 Ocean",
  forest: "🌲 Forest",
  sunset: "🌅 Sunset",
  neon: "✨ Neon",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { settings, setPresetTheme, themePresets } = useThemeCustomization();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const CurrentIcon =
    theme && theme in themeIcons
      ? themeIcons[theme as keyof typeof themeIcons]
      : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative transition-all duration-200 hover:bg-accent/50 focus-visible-ring"
        >
          <CurrentIcon className="h-4 w-4 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass border-border/50">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Appearance Mode
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer transition-all duration-200 ${
            theme === "light" ? "bg-accent/20" : ""
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Mode</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-glow" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer transition-all duration-200 ${
            theme === "dark" ? "bg-accent/20" : ""
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Mode</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-glow" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer transition-all duration-200 ${
            theme === "system" ? "bg-accent/20" : ""
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System Auto</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-glow" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          {/* <DropdownMenuSubTrigger className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            <span>Color Theme</span>
          </DropdownMenuSubTrigger> */}
          <DropdownMenuSubContent className="glass border-border/50">
            {themePresets.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => setPresetTheme(preset)}
                className="cursor-pointer"
              >
                <span>{themeNames[preset]}</span>
                {settings.theme === preset && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
