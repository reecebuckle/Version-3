# NASA Space Apps Challenge 2025 - Project Context

## Repository Overview

This repository contains an **Ocean Chlorophyll Visualization Suite** built for NASA Space Apps Challenge 2025 "Sharks in Space" challenge. The project extends Google's WebGL Globe to visualize marine ecosystem data and support shark habitat modeling.

### Current Repository Structure
```
├── src/                           # Main application source code
│   ├── globes/                   # Globe visualization implementations
│   │   └── chlorophyll-globe/    # Chlorophyll-specific globe variants
│   │       ├── index-images.html      # Monthly PNG image display
│   │       ├── index-seasonal-images.html # Seasonal PNG display
│   │       ├── index-heatmap.html     # Ocean-only heatmap overlay
│   │       ├── index-timeseries.html  # 3D data point spikes
│   │       ├── index-simple.html      # Simplified interface
│   │       ├── image-globe.js         # PNG texture globe engine
│   │       ├── heatmap-globe.js       # Smooth heatmap engine
│   │       └── chlorophyll-globe.js   # Time series globe engine
│   └── assets/                   # Static assets and dependencies
│       └── globe/               # Original WebGL Globe core files
│           ├── globe.js         # Core globe functionality
│           ├── world.jpg        # Earth texture
│           └── third-party/     # Three.js, Detector.js, Tween.js

├── chlorophyll-datasets/         # Large data files (gitignored)
│   ├── chlorophyll-monthly-images/    # Monthly PNG files
│   ├── chlorophyll-seasonal-images/   # Seasonal PNG files
│   └── chloropyhll-seasonal-binned/   # Source NetCDF files
├── chlorophyll-json-files/       # Processed JSON data (tracked in git)
│   ├── chlorophyll-seasonal-json/     # JSON data for heatmap/timeseries
│   ├── chlorophyll-basic-data/        # Basic globe visualization data
│   └── convert-seasonal-data.py       # NetCDF to JSON converter script
├── graphs/                       # Analysis notebooks and outputs
│   ├── Chlorophyll_Visualiser.ipynb  # Development notebook
│   └── *.png                    # Sample visualization outputs
├── docs/                         # Documentation
│   └── data-access-guide.md     # NASA data access instructions
├── index.html                    # Main navigation page
└── README.md                     # Project documentation
```

### File Organization Guidelines for Future Development

**Globe Visualizations** (`src/globes/[visualization-name]/`):
- Each visualization type gets its own subfolder
- HTML files: `index-[variant].html` (e.g., `index-heatmap.html`)
- JavaScript engines: `[type]-globe.js` (e.g., `heatmap-globe.js`)
- Always include home navigation link: `../../../index.html`

**Data Files**:
- **Large Data** (`chlorophyll-datasets/[data-type]/`): PNG images and NetCDF source files (gitignored)
  - `chlorophyll-[temporal]-images/` (monthly, seasonal, etc.)
  - `chlorophyll-[type]-binned/` for NetCDF/raw files
- **JSON Data** (`chlorophyll-json-files/[data-type]/`): Processed JSON for WebGL Globe (tracked in git)
  - `chlorophyll-seasonal-json/` for time series and heatmap data
  - `chlorophyll-basic-data/` for basic globe visualization data
- **Naming Convention**: `AQUA_MODIS.YYYYMMDD_YYYYMMDD.L3m.[PERIOD].CHL.chlor_a.4km.nc.png`

**Data Processing Scripts** (`chlorophyll-json-files/`):
- `convert-seasonal-data.py` - NetCDF to JSON converter
- Use relative paths: `../chlorophyll-datasets/` for source data, `./` for output
- Include clear documentation and error handling

**Assets** (`src/assets/`):
- Shared libraries (Three.js, WebGL Globe core)
- Textures and images used by multiple visualizations
- Static resources that don't change

**Documentation** (`docs/`):
- Data access guides
- Technical documentation
- User manuals
- API references

### Technical Stack
- **Three.js**: 3D graphics library
- **WebGL**: Hardware-accelerated graphics
- **Custom GLSL Shaders**: For advanced visual effects
- **JSON Data Format**: For geographic data input
- **Local Web Server**: Required for CORS/file access (python -m http.server 8000)

## NASA Space Apps Challenge 2025 - Target Projects

### Primary Target: Terra's 25th Anniversary Animation Challenge

**Objective**: Create animated visualizations using NASA Terra satellite data to showcase Earth science stories.

**Requirements**:
- Use data from Terra's 5 instruments (MODIS, CERES, MOPITT, MISR, ASTER)
- Create animated product (2D/3D, GIF, movie, interactive)
- Show Earth science story with community/environmental impact
- Include time-based animation and commentary
- Target audience: High school students and broader community

**Terra Instruments Available**:
1. **MODIS** - Moderate Resolution Imaging Spectroradiometer (Blue Marble images)
2. **CERES** - Clouds and Earth's Radiant Energy System (energy budget)
3. **MOPITT** - Measurement of Pollution in the Troposphere (CO from fires)
4. **MISR** - Multi-angle Imaging SpectroRadiometer (hurricanes, urban growth)
5. **ASTER** - Advanced Spaceborne Thermal Emission and Reflection Radiometer (zoom focus)

**Data Considerations**:
- 25+ years of continuous data (9,000+ days)
- Multiple instruments operating simultaneously
- Different resolutions need geographic alignment
- NASA Earthdata Worldview recommended for easy animation

### Secondary Option: Shark Tracking & Prediction Challenge

**Objective**: Create mathematical framework for identifying sharks and predicting foraging habitats using NASA satellite data.

**Requirements**:
- Use SWOT (Surface Water and Ocean Topography) mission data
- Use PACE (Plankton, Aerosols, Clouds, and Ecosystems) mission data
- Track ocean eddies where sharks live
- Model trophic steps from phytoplankton to sharks
- Consider variables: surface vs. deep behavior, temperature, ecological consequences
- Design conceptual tag for real-time shark feeding data

**Deliverables Could Include**:
- Mathematical model using satellite input
- Graphical products showing shark-environment relationships
- Global maps of expected shark activity
- Video presentation of hypotheses and results

## Development Strategy

### Phase 1: Terra Challenge Implementation
1. **Data Integration**: Adapt WebGL Globe to load NASA Terra data
2. **Animation System**: Implement time-based data visualization
3. **Multi-layer Support**: Enable simultaneous display of multiple Terra instruments
4. **User Interface**: Add controls for time navigation, layer selection
5. **Storytelling**: Integrate commentary and impact explanations

### Phase 2: Advanced Features
1. **Real-time Data**: Connect to NASA APIs for live data
2. **Interactive Elements**: Click-to-explore functionality
3. **Educational Content**: Embed explanations for high school audience
4. **Export Capabilities**: Generate GIFs, videos, or interactive embeds

### Technical Considerations
- **Data Format**: Convert NASA data to WebGL Globe JSON format
- **Performance**: Optimize for large temporal datasets
- **Cross-browser**: Ensure WebGL compatibility
- **Responsive**: Mobile-friendly visualization
- **Accessibility**: Screen reader support, color-blind friendly palettes

## Key Resources
- **NASA Earthdata Worldview**: Primary data source and animation tool
- **WebGL Globe Documentation**: Current codebase reference
- **Terra Mission Data**: 25 years of multi-instrument Earth observations
- **Three.js Documentation**: For 3D graphics implementation

## Success Metrics
- Interactive 3D visualization of Terra data
- Time-based animation showing Earth science processes
- Clear educational value for target audience
- Demonstrable community/environmental impact story
- Smooth performance with large datasets

## Next Steps
1. Research NASA Terra data APIs and formats
2. Design data pipeline from NASA sources to WebGL Globe
3. Implement time-based animation controls
4. Select compelling Earth science story for demonstration
5. Develop educational content and impact narrative