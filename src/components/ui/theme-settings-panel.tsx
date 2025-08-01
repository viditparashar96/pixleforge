"use client";

import * as React from "react";
import { Palette, RotateCcw, Eye, Sliders } from "lucide-react";
// import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useThemeCustomization } from "@/lib/hooks/use-theme-customization";

const themePresets = [
  { key: "electric", name: "Electric", emoji: "⚡", color: "hsl(285, 85%, 60%)" },
  { key: "ocean", name: "Ocean", emoji: "🌊", color: "hsl(200, 85%, 60%)" },
  { key: "forest", name: "Forest", emoji: "🌲", color: "hsl(140, 85%, 50%)" },
  { key: "sunset", name: "Sunset", emoji: "🌅", color: "hsl(20, 85%, 65%)" },
  { key: "neon", name: "Neon", emoji: "✨", color: "hsl(320, 85%, 65%)" },
];

export function ThemeSettingsPanel() {
  // const { theme } = useTheme();
  const { settings, updateSettings, setPresetTheme, resetToDefault } = useThemeCustomization();
  const [previewMode, setPreviewMode] = React.useState(false);

  const handleSliderChange = (key: string, value: number[]) => {
    updateSettings({ [key]: value[0] });
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative group">
          <Sliders className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Advanced theme settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme Customization
          </DialogTitle>
          <DialogDescription>
            Personalize your PixelForge Nexus experience with custom colors and themes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Presets */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Color Themes</CardTitle>
              <CardDescription>
                Choose from pre-designed color schemes or customize your own.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {themePresets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => setPresetTheme(preset.key as "electric" | "ocean" | "forest" | "sunset" | "neon")}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      settings.theme === preset.key
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2 shadow-lg"
                      style={{ backgroundColor: preset.color }}
                    />
                    <div className="text-sm font-medium">{preset.emoji}</div>
                    <div className="text-xs text-muted-foreground">{preset.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Color Controls */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Customization</CardTitle>
              <CardDescription>
                Fine-tune colors to create your perfect workspace aesthetic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Color */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Primary Hue</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(settings.hue)}°
                  </Badge>
                </div>
                <Slider
                  value={[settings.hue]}
                  onValueChange={(value) => handleSliderChange("hue", value)}
                  max={360}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div
                  className="h-4 w-full rounded-md border border-border/50"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(60, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(120, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(180, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(240, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(300, ${settings.saturation * 100}%, ${settings.lightness * 100}%), 
                      hsl(360, ${settings.saturation * 100}%, ${settings.lightness * 100}%))`
                  }}
                />
              </div>

              {/* Saturation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Saturation</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(settings.saturation * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.saturation]}
                  onValueChange={(value) => handleSliderChange("saturation", value)}
                  max={0.5}
                  min={0.1}
                  step={0.01}
                  className="w-full"
                />
              </div>

              {/* Lightness */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Lightness</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(settings.lightness * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.lightness]}
                  onValueChange={(value) => handleSliderChange("lightness", value)}
                  max={0.8}
                  min={0.3}
                  step={0.01}
                  className="w-full"
                />
              </div>

              {/* Accent Hue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Accent Hue</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(settings.accentHue)}°
                  </Badge>
                </div>
                <Slider
                  value={[settings.accentHue]}
                  onValueChange={(value) => handleSliderChange("accentHue", value)}
                  max={360}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Intensity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Color Intensity</Label>
                  <Badge variant="secondary" className="text-xs">
                    {settings.intensity.toFixed(1)}x
                  </Badge>
                </div>
                <Slider
                  value={[settings.intensity]}
                  onValueChange={(value) => handleSliderChange("intensity", value)}
                  max={1.5}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview and Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={togglePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "Exit Preview" : "Preview Mode"}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Current Theme Preview */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{
                background: `oklch(${settings.lightness} ${settings.saturation * settings.intensity} ${settings.hue}deg)`,
                color: "white"
              }}>
                <div className="flex-1">
                  <div className="font-semibold">Primary Color</div>
                  <div className="text-sm opacity-90">
                    HSL({Math.round(settings.hue)}, {Math.round(settings.saturation * 100)}%, {Math.round(settings.lightness * 100)}%)
                  </div>
                </div>
                <div 
                  className="w-8 h-8 rounded-full shadow-lg"
                  style={{
                    backgroundColor: `oklch(0.88 ${settings.accentHue > 0 ? 0.12 : 0} ${settings.accentHue}deg)`
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}