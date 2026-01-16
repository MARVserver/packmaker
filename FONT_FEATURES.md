# Custom Font Feature Innovation

## Overview
This resource pack maker now includes revolutionary custom font features inspired by Minecraft community best practices, specifically based on the Qiita article about custom fonts.

## Key Innovations

### 1. **Custom Model Data = 0 Support**
- **What's New**: You can now create item models with `custom_model_data: 0`
- **Why It Matters**: This allows you to override the base item model without requiring NBT data
- **Use Case**: Perfect for texture packs that want to change default item appearances

### 2. **Font Presets System**
Four professionally designed presets based on common Minecraft use cases:

#### GUI Overlay
- **Purpose**: Custom GUIs for containers (barrels, chests, dispensers)
- **Configuration**: 
  - Space provider with -8 pixel advance (\uE000)
  - Bitmap provider with height: 80, ascent: 10 (\uE001)
- **Usage**: `/setblock ~ ~ ~ barrel{CustomName:'{"color":"white","text":"\\uE000\\uE001"}'}`
- **How It Works**: The negative space shifts the GUI image to align perfectly with the container

#### Bleeding/Screen Effect
- **Purpose**: Full-screen overlays for damage, transitions, or atmospheric effects
- **Configuration**: 
  - Large bitmap (height: 128, ascent: 64)
- **Usage**: `/title @s title "\uE002"`
- **Tip**: Use semi-transparent images for bleeding effects, black images for fade-to-black

#### Icon Set
- **Purpose**: Small icons in text (armor, hearts, custom symbols)
- **Configuration**: 
  - Small bitmap (height: 9, ascent: 8)
- **Usage**: `{"attribute.name.armor": "§f\\uE003§r防御力"}`
- **Note**: Use §f (white color code) before the icon to prevent color tinting

#### Particle/Display Entity
- **Purpose**: Custom particles using text_display entities
- **Configuration**: 
  - Medium bitmap (height: 16, ascent: 12)
- **Usage**: `summon text_display ~ ~ ~ {text:'{"text":"\\uE004"}'}`

### 3. **Unicode Helper Tool**
- **Private Use Area (U+E000 - U+F8FF)**: Recommended for custom fonts
- **Supplementary Private Use Area-A (U+F0000 - U+FFFFD)**: For advanced users
- **Features**:
  - Visual preview of unicode characters
  - One-click selection of safe unicode ranges
  - Hex to unicode conversion

### 4. **Enhanced Provider Management**

#### Bitmap Provider
- Upload PNG textures
- Configure height and ascent (ascent must be < height)
- Multi-row character grid support
- Visual file name display

#### Space Provider
- Add multiple character advances
- Support for negative values (shift left)
- Visual badges showing positive/negative advances
- Perfect for GUI alignment

#### TTF Provider
- Upload .ttf or .otf files
- Configure size, oversample, and shift
- Skip specific characters

## Best Practices

### Font File Naming
- Use descriptive names: `gui_overlay`, `bleeding_effect`, `custom_icons`
- Font path will be: `namespace:font/your_font_name`

### Unicode Character Selection
- **Start at U+E000**: This is the Private Use Area, safe from conflicts
- **Sequential allocation**: Use E000, E001, E002... for easy management
- **Document your mappings**: Keep track of which unicode maps to which image

### Ascent and Height Guidelines
- **GUI Overlays**: height: 80-256, ascent: 10-64 (large, positioned high)
- **Screen Effects**: height: 128-256, ascent: 64-128 (full screen)
- **Icons**: height: 8-16, ascent: 7-12 (small, inline with text)
- **Particles**: height: 16-32, ascent: 12-24 (medium size)

### Negative Space Technique
The negative space technique is crucial for GUI overlays:
1. Create a space provider with negative advance (e.g., -8)
2. Create a bitmap provider with your GUI image
3. Use them together: `\uE000\uE001`
4. The negative space shifts the image left, centering it in containers

## Migration Guide

### From Old Font System
If you have existing fonts:
1. Your fonts will continue to work
2. Consider using presets for new fonts
3. Use the Unicode Helper to avoid character conflicts

### Updating Custom Model Data
If you have models with CMD >= 1:
- They will continue to work
- You can now also create CMD=0 models for base overrides
- No migration needed

## Technical Details

### Export Behavior
- Fonts are exported to `assets/namespace/font/`
- Bitmap textures go to `assets/namespace/textures/font/`
- TTF files go to `assets/namespace/font/`
- default.json and uniform.json are supported for global fonts

### Validation
- Ascent must be less than height
- Unicode characters must be valid
- File uploads are validated for correct types (PNG for bitmaps, TTF/OTF for fonts)

## Examples

### Example 1: Custom Chest GUI
```json
{
  "providers": [
    {
      "type": "space",
      "advances": {
        "\uE000": -8
      }
    },
    {
      "type": "bitmap",
      "file": "namespace:font/chest_gui.png",
      "ascent": 10,
      "height": 80,
      "chars": ["\uE001"]
    }
  ]
}
```

Command: `/setblock ~ ~ ~ chest{CustomName:'{"color":"white","text":"\\uE000\\uE001"}'}`

### Example 2: Damage Overlay
```json
{
  "providers": [
    {
      "type": "bitmap",
      "file": "namespace:font/blood.png",
      "ascent": 64,
      "height": 128,
      "chars": ["\uE002"]
    }
  ]
}
```

Command: `/title @s title "\uE002"`

### Example 3: Custom Armor Icon
```json
{
  "providers": [
    {
      "type": "bitmap",
      "file": "minecraft:gui/sprites/hud/armor_half.png",
      "ascent": 8,
      "height": 9,
      "chars": ["\uE003"]
    }
  ]
}
```

Language file: `{"attribute.name.armor": "§f\\uE003§r防御力"}`

## Troubleshooting

### Font Not Showing
- Ensure you're using the correct font namespace in commands
- Check that ascent < height
- Verify unicode characters are correctly escaped in commands

### GUI Not Aligned
- Adjust the negative space value (try -4, -8, -16)
- Check the ascent value (lower = higher on screen)
- Ensure you're using white color code: `"color":"white"`

### Icons Tinted Wrong Color
- Add §f before the unicode character
- Add §r after to reset color
- Example: `§f\uE003§r`

## Credits
Based on the excellent Qiita article by Acryle:
https://qiita.com/Acryle/items/d2d58359b55bd5ece6a0
