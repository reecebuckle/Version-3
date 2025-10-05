# Ocean Chlorophyll Visualisation Suite

## 🚀 **[LIVE DEMO - Click Here to Start →](https://reecebuckle.github.io/Version-3/)**

Interactive 3D visualisations of ocean chlorophyll-a concentrations for NASA Space Apps Challenge 2025. This project extends the [WebGL Globe](https://github.com/dataarts/webgl-globe) by Google Data Arts Team to visualise marine ecosystem data and support shark habitat modelling.

### Quick Access Links:
- **🏠 [Main Navigation Page](https://reecebuckle.github.io/Version-3/)** - Start here
- **🖼️ [Image Globe](https://reecebuckle.github.io/Version-3/src/globes/image-globe/index.html)** - Monthly & seasonal PNG display
- **🌊 [Ocean Heatmap](https://reecebuckle.github.io/Version-3/src/globes/heatmap-globe/index.html)** - Smooth gradient overlay
- **📊 [Time Series](https://reecebuckle.github.io/Version-3/src/globes/time-series-globe/index.html)** - 3D data points
- **🦈 [Whale Shark Tracking](https://reecebuckle.github.io/Version-3/src/globes/whale-shark-globe/index-whale-shark-tracks.html)** - Migration patterns

## Project Overview

This visualisation suite was developed for NASA's **"Sharks in Space"** challenge, which aims to use satellite data to understand and predict shark foraging habitats. By visualising ocean chlorophyll concentrations - a key indicator of marine productivity - we can identify areas where sharks are likely to find abundant food sources and track seasonal migration patterns.

## Data Sources

The project uses open ocean colour data from NASA's [PACE Ocean Colour Data Portal](https://pace.oceansciences.org/access_pace_data.htm). The chlorophyll-a concentration dataset is collected by the **Aqua-MODIS instrument** and provides:

- **4km spatial resolution** global coverage
- **Monthly and seasonal** temporal resolution  
- **23+ years** of continuous observations (2002-2025)
- **Chlorophyll-a concentrations** in mg/m³, indicating ocean productivity levels

Chlorophyll-a is a critical indicator of phytoplankton abundance, which forms the base of the marine food web. Higher concentrations indicate productive waters that support larger fish populations and, consequently, shark feeding areas.

## Data Analysis

Our analysis of NASA's chlorophyll-a concentration data reveals key insights into marine ecosystem patterns and potential shark feeding habitats:

### Spatial Distribution Patterns
![Chlorophyll Concentration Heatmap](graphs/Chlorophyll%20Concentration%20Heatmap.png)

The global chlorophyll concentration heatmap shows distinct productivity zones:
- **High productivity regions** (>1.0 mg/m³) concentrated in coastal upwelling areas, polar regions, and major river deltas
- **Oligotrophic zones** (<0.1 mg/m³) dominating tropical and subtropical ocean gyres
- **Seasonal productivity bands** following temperature and nutrient gradients
- **Continental shelf areas** showing elevated chlorophyll due to nutrient runoff and shallow water mixing

### Statistical Distribution Analysis
![Chlorophyll Distributions](graphs/Chlorphyll%20Distributions.png)

The chlorophyll concentration distribution analysis reveals:
- **Log-normal distribution** typical of biological oceanographic data
- **Bimodal patterns** distinguishing productive coastal waters from oligotrophic open ocean
- **Seasonal variability** with higher concentrations during spring blooms and upwelling periods
- **Geographic clustering** of similar productivity levels indicating distinct marine ecosystems

### Shark Feeding Habitat Predictions
![Predicted Feeding Areas](graphs/Predicted%20Feeding.png)

Based on chlorophyll patterns and trophic relationships, our model identifies:
- **Primary feeding zones** correlating with moderate chlorophyll levels (0.3-1.0 mg/m³) where prey fish concentrate
- **Migration corridors** following seasonal productivity gradients
- **Hotspot regions** where multiple environmental factors converge to create optimal foraging conditions
- **Temporal patterns** showing seasonal shifts in predicted feeding activity

These analyses support the hypothesis that satellite-derived chlorophyll data can effectively predict shark habitat preferences by identifying productive marine regions that support robust food webs.

## Interactive Visualisations

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
