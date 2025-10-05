# PACE Chlorophyll Data Access Guide

## Quick Start with NASA Worldview

1. **Go to**: https://worldview.earthdata.nasa.gov/
2. **Add PACE Chlorophyll Layer**:
   - Click "Add Layers" (left panel)
   - Search: "PACE Chlorophyll" or "OCI"
   - Add: "Chlorophyll a (OCI/PACE)"
3. **Explore Data**:
   - Use timeline at bottom to change dates
   - Zoom to areas of interest (coastal regions show more variation)
   - Notice seasonal patterns and geographic differences

## Download Sample Data

### From Worldview (Images):
- Click camera icon → "Take a Snapshot"
- Choose GeoTIFF for georeferenced data
- Or PNG for quick visualization

### From OB.DAAC (Raw Data):
- **URL**: https://oceancolor.gsfc.nasa.gov/l3/
- **Mission**: PACE
- **Product**: CHL (Chlorophyll-a)
- **Status**: Provisional
- **Resolution**: Start with 4km daily or 9km 8-day composite

## Data Format Notes

**NetCDF Files** contain:
- Latitude/Longitude grids
- Chlorophyll concentration values (mg/m³)
- Quality flags and metadata
- Time stamps

**Conversion Needed**:
- Extract lat/lon/chlorophyll triplets
- Convert to WebGL Globe JSON format: [lat, lon, magnitude]
- Handle missing data (land/clouds)

## Sample Data Locations to Check

**High Chlorophyll Areas** (good for visualization):
- **North Atlantic** (spring blooms)
- **Coastal California** (upwelling)
- **North Sea** (seasonal patterns)
- **Great Barrier Reef** (coral ecosystem)

**Low Chlorophyll Areas** (ocean deserts):
- **Central Pacific Gyre**
- **Sargasso Sea**
- **Central Atlantic**

## Next Steps

1. **Explore Worldview** - get familiar with data patterns
2. **Download sample NetCDF** - from OB.DAAC
3. **Create data converter** - NetCDF to WebGL Globe JSON
4. **Test visualization** - load into our globe