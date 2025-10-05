# Whale Shark Tracking Globe

Interactive 3D visualisation of whale shark movement patterns in the Gulf of Mexico (2009-2015).

## Files

- `index.html` - Full-featured whale shark tracking with time controls and background switching
- `index-simple.html` - Simplified version with basic shark filtering controls
- `whale-shark-globe.js` - Core WebGL globe engine for whale shark visualisation
- `README.md` - This documentation file

## Features

### Full Version (`index.html`)
- **Time Controls**: Navigate through yearly periods (2009-2015)
- **Playback Animation**: Automatically cycle through years
- **Individual Shark Selection**: Toggle specific sharks on/off
- **Background Switching**: Switch between Earth view and chlorophyll concentration data
- **Movement Statistics**: Comprehensive tracking statistics
- **Responsive Design**: Mobile-friendly interface

### Simple Version (`index-simple.html`)
- **Basic Filtering**: Show all sharks, 5 sharks, or 1 shark
- **Movement Statistics**: Key tracking metrics in dual-column layout
- **Legend**: Visual guide for symbols and colours
- **Simplified Controls**: Easy-to-use interface for educational purposes

## Data Sources

- **Whale Shark Data**: `../../../whale-shark-json-files/whale-shark-json/whale_sharks_complete.json`
- **Earth Texture**: `../../assets/globe/globe-sea-8k.jpg`
- **Whale Shark Icon**: `../../assets/shark-v3.jpg`
- **Chlorophyll Data**: `../../../chlorophyll-datasets/chlorophyll-annual-compressed/`

## Dependencies

- Three.js (WebGL 3D graphics)
- Detector.js (WebGL capability detection)
- Tween.js (Animation tweening)

## Usage

1. Start a local web server (required for CORS):
   ```bash
   python -m http.server 8000
   ```

2. Navigate to:
   - Full version: `http://localhost:8000/src/globes/whale-shark-globe/index.html`
   - Simple version: `http://localhost:8000/src/globes/whale-shark-globe/index-simple.html`

## Technical Details

- **Coordinate System**: Geographic coordinates (latitude/longitude)
- **Time Range**: 2009-2015 (6 years of tracking data)
- **Shark Count**: 41 individual whale sharks
- **Total Tracking Points**: 3,333+ GPS positions
- **Rendering**: Hardware-accelerated WebGL with custom shaders
- **Performance**: Optimised for smooth interaction with large datasets

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Requires WebGL support