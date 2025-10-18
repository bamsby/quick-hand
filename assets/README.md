# QuickHand Assets

## Logo Design Concept
The QuickHand logo combines two key elements:
- **Lightning Bolt (⚡)** - Represents speed and quickness
- **Pointing Hand (👆)** - Represents action and hands-on execution

**Color Scheme:**
- Primary: Indigo gradient (#6366f1 → #8b5cf6)
- Accent: Amber/Gold (#fbbf24, #f59e0b)
- White/Light gray for contrast

---

## Generating PNG Assets from SVG

You can convert the `logo.svg` file to the required PNG formats using one of these methods:

### Method 1: Using Online Tools (Easiest)
1. Open `logo.svg` in your browser or text editor
2. Go to https://svgtopng.com or https://cloudconvert.com/svg-to-png
3. Upload `logo.svg`
4. Generate the following sizes:
   - **icon.png**: 1024x1024px (app icon)
   - **adaptive-icon.png**: 1024x1024px (Android adaptive icon foreground)
   - **splash-icon.png**: 1024x1024px (splash screen)
   - **favicon.png**: 48x48px (web favicon)

### Method 2: Using ImageMagick (Command Line)
```powershell
# Install ImageMagick first: https://imagemagick.org/script/download.php
# Or via Chocolatey: choco install imagemagick

# Generate all required sizes
magick convert -background none logo.svg -resize 1024x1024 icon.png
magick convert -background none logo.svg -resize 1024x1024 adaptive-icon.png
magick convert -background none logo.svg -resize 1024x1024 splash-icon.png
magick convert -background none logo.svg -resize 48x48 favicon.png
```

### Method 3: Using Inkscape (Free Desktop App)
1. Download Inkscape: https://inkscape.org/
2. Open `logo.svg`
3. File → Export PNG Image
4. Set width/height to required dimensions
5. Export each required file

---

## Required Asset Files

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024x1024 | iOS/Android app icon |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon (foreground layer) |
| `splash-icon.png` | 1024x1024 | Native splash screen icon |
| `favicon.png` | 48x48 | Web app favicon |

**Note:** All icons should have transparent backgrounds except where specified in `app.json`.

---

## Asset Configuration (app.json)

Current configuration:
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash-icon.png",
    "backgroundColor": "#6366f1"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

---

## Temporary Placeholder Solution

If you want to skip asset generation for now and just test the app launch flow:

1. Create simple placeholder images using emoji or solid colors
2. The app will still work with the existing placeholder assets
3. The **splash screen component** in `lib/ui/splash-screen.tsx` uses emojis (⚡👆) as a fallback and will display correctly regardless of icon assets

---

## Future Enhancements

Consider creating:
- Animated splash screen (Lottie JSON)
- App Store/Play Store screenshots
- Social media preview images (OG images)
- Brand guidelines document

---

## Design Credits

Logo concept: QuickHand = Quick (Lightning) + Hand (Action)
Created for the QuickHand mobile AI agent project.

