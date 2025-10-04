# NASA Space Apps Challenge 2025 - Project Context

## Repository Overview

This repository contains a **WebGL Globe** visualization toolkit (originally from Google Data Arts Team) that we're adapting for NASA Space Apps Challenge 2025. The project enables interactive 3D Earth visualizations for displaying geographic and satellite data.

### Current Repository Structure
```
├── globe/                    # Basic WebGL globe implementation
│   ├── index.html           # Main visualization (WORKING - view at localhost:8000)
│   ├── globe.js             # Core globe functionality
│   ├── population909500.json # Sample population data (1990-2008)
│   ├── world.jpg            # Earth texture
│   ├── loading.gif          # Loading animation
│   ├── ce.png              # Chrome Experiments logo
│   └── third-party/        # Dependencies (Three.js, Detector.js, Tween.js)
├── globe-search/            # Globe with search functionality
├── globe-vertex-texture/    # Advanced version with custom shaders
├── polymer-globe/           # Web Components implementation
├── README.md               # Original WebGL Globe documentation
└── .gitignore              # Standard gitignore
```

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