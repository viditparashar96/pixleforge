# PixelForge Nexus - Customization Guide

## 🎨 Theme Customization Features

PixelForge Nexus now includes comprehensive theme customization options to make your development environment truly yours.

### 🌓 Dark/Light Mode Toggle

**Location**: Top-right corner of the dashboard and landing page
- **Light Mode**: Clean, bright interface for daytime work
- **Dark Mode**: Eye-friendly dark theme for extended development sessions
- **System Mode**: Automatically follows your operating system preference

### 🎭 Color Theme Presets

Choose from 5 professionally designed color themes:

1. **⚡ Electric** (Default) - Purple and cyan gaming aesthetics
2. **🌊 Ocean** - Calming blue tones for focused work
3. **🌲 Forest** - Natural green hues for organic feel
4. **🌅 Sunset** - Warm orange and pink for creative sessions
5. **✨ Neon** - Vibrant magenta for high-energy development

### ⚙️ Advanced Customization Panel

Access the **Theme Settings Panel** via the sliders icon for fine-grained control:

#### Primary Color Controls
- **Hue** (0-360°): Choose any color on the spectrum
- **Saturation** (10-50%): Control color intensity
- **Lightness** (30-80%): Adjust brightness level
- **Accent Hue** (0-360°): Secondary color for highlights
- **Color Intensity** (0.5-1.5x): Boost or reduce vibrancy

#### Real-time Preview
- Live color preview shows changes instantly
- Preview mode for testing before applying
- Reset to defaults option available

### 💾 Persistent Settings

All customizations are:
- Saved to browser localStorage
- Applied automatically on page load
- Synchronized across all pages
- Independent for each user/device

### 🎯 Dynamic Color System

The theme system uses:
- **OKLCH color space** for perceptually uniform colors
- **CSS custom properties** for real-time updates
- **Calculated values** that maintain accessibility
- **Gradient generation** based on your color choices

### 🚀 How to Use

1. **Quick Theme Change**: Click the theme toggle → Select appearance mode + color theme
2. **Advanced Customization**: Click the sliders icon → Adjust sliders → See live preview
3. **Reset**: Use the "Reset" button to return to defaults

### 🎨 Color Theory Integration

The system intelligently:
- Maintains proper contrast ratios
- Generates harmonious color palettes
- Adapts sidebar and component colors
- Ensures accessibility compliance (WCAG 2.1 AA)

### 🔧 Technical Details

**CSS Variables Used:**
- `--theme-hue`: Primary color hue (degrees)
- `--theme-saturation`: Color saturation (0-1)
- `--theme-lightness`: Color lightness (0-1)
- `--accent-hue`: Accent color hue (degrees)
- `--secondary-hue`: Secondary color hue (degrees)
- `--theme-intensity`: Color intensity multiplier

**Components Affected:**
- Dashboard layout and navigation
- Cards and buttons
- Status indicators and badges
- Form inputs and selections
- Charts and data visualizations
- Gradient backgrounds and effects

Enjoy creating your perfect development environment! 🎯