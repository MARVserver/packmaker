# Changelog

All notable changes to the MARV Resource Pack Maker will be documented in this file.

## [2.0.0] - 2026-01-16

### 🎉 Major Features

#### Custom Model Data = 0 Support
- **Added**: Support for `custom_model_data: 0` in item models
- **Changed**: Validation now allows CMD values from 0 to infinity (previously 1+)
- **Added**: Helper text in model editor explaining CMD=0 usage
- **Impact**: Users can now override base item models without NBT data

#### Revolutionary Font Manager
- **Added**: Quick Start Presets system with 4 professional templates:
  - GUI Overlay (for custom container GUIs)
  - Bleeding Effect (for full-screen overlays)
  - Icon Set (for inline text icons)
  - Particle Display (for text_display entities)
- **Added**: Unicode Helper tool with:
  - Private Use Area character selection
  - Visual unicode preview
  - One-click copy functionality
  - Hex to unicode conversion
- **Enhanced**: Provider management with:
  - Visual badges for positive/negative space advances
  - Improved file upload indicators
  - Better tooltips and descriptions
  - Usage examples with copy-to-clipboard
- **Added**: Preset-based font creation workflow
- **Improved**: Font provider UI with better visual hierarchy

### 📚 Documentation
- **Added**: `FONT_FEATURES.md` - Comprehensive guide to custom fonts
- **Added**: `INNOVATION_SUMMARY.md` - Quick reference for new features
- **Added**: `README.md` - Project overview and getting started guide
- **Added**: Inline documentation and tooltips throughout the UI

### 🎨 UI/UX Improvements
- **Enhanced**: Font manager with modern card-based layout
- **Added**: Visual preset cards with icons and descriptions
- **Improved**: Provider type badges with color coding
- **Added**: Copy-to-clipboard buttons for usage examples
- **Enhanced**: Unicode character display in tables
- **Improved**: Form validation messages

### 🐛 Bug Fixes
- **Fixed**: Custom model data validation edge cases
- **Fixed**: Font provider type handling
- **Improved**: Error messages for font configuration

### 🔧 Technical Changes
- **Updated**: `validateModel()` function to accept CMD >= 0
- **Updated**: `addModel()` function to start from CMD = 0
- **Refactored**: Font manager component for better maintainability
- **Added**: Font preset templates with proper typing
- **Improved**: Unicode character handling and display

### 📖 Credits
- Inspired by Qiita article "カスタムフォントで彩を" by Acryle
- Based on Minecraft community best practices
- Implements techniques from the Japanese Minecraft modding community

---

## [1.0.0] - Previous Version

### Features
- Basic item model creation
- Texture management
- Font support (basic)
- Sound management
- Particle definitions
- Multi-version support
- Geyser mappings
- BBModel import
- Pack merging

---

## Future Plans

### Planned for 2.1.0
- [ ] Animation editor for textures
- [ ] 3D model preview
- [ ] More font presets (damage indicators, boss bars, etc.)
- [ ] Font preview system
- [ ] Unicode character library

### Planned for 3.0.0
- [ ] Collaborative editing
- [ ] Cloud storage integration
- [ ] Advanced shader editor
- [ ] Real-time Minecraft preview
- [ ] Template marketplace

---

## Version History

| Version | Date | Key Features |
|---------|------|--------------|
| 2.0.0 | 2026-01-16 | CMD=0 support, Revolutionary font manager |
| 1.0.0 | Previous | Initial release with core features |

---

## Breaking Changes

### 2.0.0
- **None**: All changes are backward compatible
- Existing resource packs will continue to work
- Font definitions are enhanced but maintain compatibility

---

## Migration Guide

### From 1.x to 2.0

#### Custom Model Data
No migration needed. Your existing models with CMD >= 1 will continue to work. You can now also create models with CMD = 0.

**Before (1.x):**
```json
{
  "custom_model_data": 1  // Minimum value
}
```

**After (2.0):**
```json
{
  "custom_model_data": 0  // Now valid!
}
```

#### Custom Fonts
Existing fonts will continue to work. New features are additive:

**Before (1.x):**
- Manual font creation
- Basic provider configuration

**After (2.0):**
- Use Quick Start Presets for faster creation
- Access Unicode Helper for character selection
- Copy usage examples directly
- Enhanced visual feedback

---

## Acknowledgments

Special thanks to:
- **Acryle** for the excellent Qiita article on custom fonts
- The **Minecraft modding community** for sharing techniques
- **shadcn/ui** for the beautiful component library
- All contributors and users of this tool

---

**Note**: This project follows [Semantic Versioning](https://semver.org/).
