"use client";

import { useState, useEffect, useCallback } from "react";

export interface ThemeSettings {
  theme: "electric" | "ocean" | "forest" | "sunset" | "neon";
  hue: number;
  saturation: number;
  lightness: number;
  accentHue: number;
  secondaryHue: number;
  intensity: number;
}

const defaultSettings: ThemeSettings = {
  theme: "electric",
  hue: 285,
  saturation: 0.25,
  lightness: 0.55,
  accentHue: 240,
  secondaryHue: 195,
  intensity: 1,
};

const themePresets: Record<ThemeSettings["theme"], Omit<ThemeSettings, "theme">> = {
  electric: {
    hue: 285,
    saturation: 0.25,
    lightness: 0.55,
    accentHue: 240,
    secondaryHue: 195,
    intensity: 1,
  },
  ocean: {
    hue: 200,
    saturation: 0.3,
    lightness: 0.5,
    accentHue: 180,
    secondaryHue: 220,
    intensity: 1,
  },
  forest: {
    hue: 140,
    saturation: 0.25,
    lightness: 0.45,
    accentHue: 160,
    secondaryHue: 120,
    intensity: 1,
  },
  sunset: {
    hue: 20,
    saturation: 0.35,
    lightness: 0.6,
    accentHue: 340,
    secondaryHue: 45,
    intensity: 1,
  },
  neon: {
    hue: 320,
    saturation: 0.4,
    lightness: 0.65,
    accentHue: 280,
    secondaryHue: 180,
    intensity: 1.2,
  },
};

export function useThemeCustomization() {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pixelforge-theme-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to load theme settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newSettings: ThemeSettings) => {
    if (typeof document === "undefined") return; // SSR safety
    
    const root = document.documentElement;
    
    // Set data-theme attribute for theme-specific CSS
    root.setAttribute("data-theme", newSettings.theme);
    
    // Apply custom CSS variables for advanced customization
    root.style.setProperty("--theme-hue", newSettings.hue.toString());
    root.style.setProperty("--theme-saturation", newSettings.saturation.toString());
    root.style.setProperty("--theme-lightness", newSettings.lightness.toString());
    root.style.setProperty("--accent-hue", newSettings.accentHue.toString());
    root.style.setProperty("--secondary-hue", newSettings.secondaryHue.toString());
    root.style.setProperty("--theme-intensity", newSettings.intensity.toString());
    
    // Add a brief visual feedback
    root.style.transition = "all 0.3s ease";
  }, []);

  // Save settings to localStorage and apply
  const updateSettings = useCallback((newSettings: Partial<ThemeSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem("pixelforge-theme-settings", JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save theme settings:", error);
    }
    
    applyTheme(updated);
  }, [settings, applyTheme]);

  // Set preset theme
  const setPresetTheme = useCallback((theme: ThemeSettings["theme"]) => {
    const preset = themePresets[theme];
    updateSettings({ theme, ...preset });
  }, [updateSettings]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem("pixelforge-theme-settings");
    applyTheme(defaultSettings);
  }, [applyTheme]);

  // Apply theme on load
  useEffect(() => {
    if (isLoaded) {
      applyTheme(settings);
    }
  }, [isLoaded, settings, applyTheme]);

  return {
    settings,
    updateSettings,
    setPresetTheme,
    resetToDefault,
    isLoaded,
    themePresets: Object.keys(themePresets) as ThemeSettings["theme"][],
  };
}