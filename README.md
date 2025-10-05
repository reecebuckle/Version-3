# Ocean Chlorophyll Visualization Suite

Interactive 3D visualizations of ocean chlorophyll-a concentrations for NASA Space Apps Challenge 2025. This project extends the [WebGL Globe](https://github.com/dataarts/webgl-globe) by Google Data Arts Team to visualize marine ecosystem data and support shark habitat modeling.

## Project Overview

This visualization suite was developed for NASA's **"Sharks in Space"** challenge, which aims to use satellite data to understand and predict shark foraging habitats. By visualizing ocean chlorophyll concentrations - a key indicator of marine productivity - we can identify areas where sharks are likely to find abundant food sources and track seasonal migration patterns.

## Data Sources

The project uses open ocean color data from NASA's [PACE Ocean Color Data Portal](https://pace.oceansciences.org/access_pace_data.htm). The chlorophyll-a concentration dataset is collected by the **Aqua-MODIS instrument** and provides:

- **4km spatial resolution** global coverage
- **Monthly and seasonal** temporal resolution  
- **23+ years** of continuous observations (2002-2025)
- **Chlorophyll-a concentrations** in mg/m³, indicating ocean productivity levels

Chlorophyll-a is a critical indicator of phytoplankton abundance, which forms the base of the marine food web. Higher concentrations indicate productive waters that support larger fish populations and, consequently, shark feeding areas.

## Visualizations

- **Monthly Image Globe** - High-resolution PNG textures showing monthly chlorophyll patterns
- **Seasonal Image Globe** - Quarterly averages highlighting seasonal productivity cycles  
- **Ocean-Only Heatmap** - Smooth gradient overlays with continental filtering
- **Time Series Points** - 3D data spikes showing spatial-temporal patterns
- **Simple Globe View** - Streamlined interface for educational use

## Credits

Built upon the [WebGL Globe](https://github.com/dataarts/webgl-globe) by Google Data Arts Team. Original examples available at [Chrome Experiments](https://experiments.withgoogle.com/chrome/globe).

## Setup

```bash
# Start local server
python -m http.server 8000

# Visit http://localhost:8000
```

**Note:** Large dataset files are excluded from this repository. Download chlorophyll data from NASA's PACE portal to populate the `chlorophyll-datasets/` folder.
