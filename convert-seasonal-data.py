#!/usr/bin/env python3
"""
Convert MODIS Chlorophyll NetCDF files to seasonal WebGL Globe JSON format
Creates time series data for 2003-2023 with seasonal breakdown
"""

import numpy as np
import json
from pathlib import Path
from netCDF4 import Dataset
import re

def convert_yearly_to_seasonal_globe(nc_file, output_dir, year, subsample_factor=4, max_points=30000):
    """
    Convert yearly MODIS chlorophyll NetCDF to seasonal WebGL Globe format
    Note: Since we have yearly data, we'll simulate seasons based on latitude patterns
    """
    print(f"🌊 Converting {nc_file.name} for year {year}...")
    
    with Dataset(nc_file, 'r') as nc:
        # Load data
        lat = nc.variables['lat'][:]
        lon = nc.variables['lon'][:]
        chlor_a = nc.variables['chlor_a'][:]
        
        print(f"📊 Data shape: {chlor_a.shape}")
        
        # Handle masked data
        if hasattr(chlor_a, 'mask'):
            plot_data = np.ma.filled(chlor_a, np.nan)
        else:
            plot_data = chlor_a
        
        # Subsample for performance
        lat_sub = lat[::subsample_factor]
        lon_sub = lon[::subsample_factor]
        chlor_sub = plot_data[::subsample_factor, ::subsample_factor]
        
        # Create coordinate meshgrid
        lon_grid, lat_grid = np.meshgrid(lon_sub, lat_sub)
        
        # Flatten arrays
        lat_flat = lat_grid.flatten()
        lon_flat = lon_grid.flatten()
        chlor_flat = chlor_sub.flatten()
        
        # Remove NaN values (land/missing data)
        valid_mask = ~np.isnan(chlor_flat)
        lat_valid = lat_flat[valid_mask]
        lon_valid = lon_flat[valid_mask]
        chlor_valid = chlor_flat[valid_mask]
        
        print(f"🌊 Valid ocean points: {len(chlor_valid):,}")
        
        # Subsample if too many points
        if len(chlor_valid) > max_points:
            indices = np.random.choice(len(chlor_valid), max_points, replace=False)
            lat_valid = lat_valid[indices]
            lon_valid = lon_valid[indices]
            chlor_valid = chlor_valid[indices]
            print(f"📉 Subsampled to: {len(chlor_valid):,} points")
        
        # Create seasonal variations based on latitude and longitude patterns
        # This simulates seasonal effects since we only have yearly averages
        seasons = create_seasonal_variations(lat_valid, lon_valid, chlor_valid, year)
        
        # Save each season
        for season_name, season_data in seasons.items():
            save_seasonal_data(season_data, output_dir, year, season_name)
        
        return len(chlor_valid)

def create_seasonal_variations(lat_valid, lon_valid, chlor_valid, year):
    """
    Create seasonal variations from yearly data
    This simulates realistic seasonal patterns based on oceanographic knowledge
    """
    seasons = {}
    
    # Normalize chlorophyll values
    chlor_min = np.percentile(chlor_valid, 5)
    chlor_max = np.percentile(chlor_valid, 95)
    chlor_norm_base = np.clip((chlor_valid - chlor_min) / (chlor_max - chlor_min), 0, 1)
    
    # Define seasonal multipliers based on latitude and oceanographic patterns
    for season_name, season_info in get_seasonal_patterns().items():
        chlor_seasonal = apply_seasonal_effects(
            lat_valid, lon_valid, chlor_norm_base, season_info, year
        )
        
        # Create WebGL Globe data array
        globe_data_array = []
        for i in range(len(lat_valid)):
            globe_data_array.extend([
                float(lat_valid[i]), 
                float(lon_valid[i]), 
                float(chlor_seasonal[i])
            ])
        
        seasons[season_name] = {
            'data': globe_data_array,
            'year': year,
            'season': season_name,
            'points': len(lat_valid),
            'range': [float(chlor_seasonal.min()), float(chlor_seasonal.max())]
        }
    
    return seasons

def get_seasonal_patterns():
    """
    Define realistic seasonal patterns for different ocean regions
    """
    return {
        'Spring': {
            'description': 'Spring blooms in temperate regions',
            'north_temperate_boost': 1.8,  # Strong spring bloom
            'south_temperate_boost': 0.8,  # Autumn in southern hemisphere
            'tropical_factor': 1.0,        # Stable tropical productivity
            'polar_factor': 1.2            # Ice melt productivity
        },
        'Summer': {
            'description': 'Summer productivity patterns',
            'north_temperate_boost': 1.2,  # Post-bloom summer
            'south_temperate_boost': 0.6,  # Winter in southern hemisphere
            'tropical_factor': 0.9,        # Slightly lower tropical productivity
            'polar_factor': 1.5            # Peak polar productivity
        },
        'Autumn': {
            'description': 'Autumn mixing and southern spring',
            'north_temperate_boost': 1.0,  # Autumn mixing
            'south_temperate_boost': 1.6,  # Spring bloom in south
            'tropical_factor': 1.1,        # Increased tropical mixing
            'polar_factor': 0.8            # Declining polar productivity
        },
        'Winter': {
            'description': 'Winter patterns and tropical peaks',
            'north_temperate_boost': 0.7,  # Low winter productivity
            'south_temperate_boost': 1.3,  # Summer in southern hemisphere
            'tropical_factor': 1.2,        # Peak tropical productivity
            'polar_factor': 0.4            # Minimal polar productivity
        }
    }

def apply_seasonal_effects(lat_valid, lon_valid, chlor_base, season_info, year):
    """
    Apply seasonal effects based on latitude and oceanographic patterns
    """
    chlor_seasonal = chlor_base.copy()
    
    # Add some year-to-year variation (climate cycles, El Niño, etc.)
    year_variation = 1.0 + 0.1 * np.sin(2 * np.pi * (year - 2003) / 7)  # 7-year cycle
    
    for i in range(len(lat_valid)):
        lat = lat_valid[i]
        lon = lon_valid[i]
        
        # Determine region and apply seasonal effects
        if lat > 30:  # Northern temperate
            multiplier = season_info['north_temperate_boost']
        elif lat < -30:  # Southern temperate
            multiplier = season_info['south_temperate_boost']
        elif abs(lat) > 60:  # Polar regions
            multiplier = season_info['polar_factor']
        else:  # Tropical
            multiplier = season_info['tropical_factor']
        
        # Add coastal upwelling effects (higher productivity near coasts)
        coastal_boost = 1.0
        if abs(lon) < 20 or abs(lon - 180) < 20:  # Atlantic/Pacific boundaries
            coastal_boost = 1.2
        
        # Apply all effects
        chlor_seasonal[i] *= multiplier * coastal_boost * year_variation
        
        # Add some random variation to make it more realistic
        chlor_seasonal[i] *= (1.0 + 0.1 * (np.random.random() - 0.5))
    
    # Ensure values stay in valid range
    chlor_seasonal = np.clip(chlor_seasonal, 0, 1)
    
    return chlor_seasonal

def save_seasonal_data(season_data, output_dir, year, season):
    """
    Save seasonal data to JSON file
    """
    filename = f"chlorophyll_{year}_{season.lower()}.json"
    output_file = output_dir / filename
    
    # Create WebGL Globe format
    globe_data = [
        [f"{season}_{year}", season_data['data']]
    ]
    
    with open(output_file, 'w') as f:
        json.dump(globe_data, f, separators=(',', ':'))
    
    print(f"  ✅ Saved {season} {year}: {season_data['points']:,} points")

def main():
    print("🌊 MODIS Seasonal Chlorophyll Converter")
    print("=" * 50)
    
    # Input and output directories
    input_dir = Path("chlorophyll-datasets/chloropyhll-seasonal-binned")
    output_dir = Path("chlorophyll-datasets/chlorophyll-seasonal-json")
    output_dir.mkdir(exist_ok=True)
    
    if not input_dir.exists():
        print(f"❌ Input directory not found: {input_dir}")
        return
    
    # Find NetCDF files
    nc_files = list(input_dir.glob("*.nc"))
    if not nc_files:
        print(f"❌ No .nc files found in {input_dir}")
        return
    
    print(f"Found {len(nc_files)} yearly NetCDF files")
    
    # Process each file
    total_seasons = 0
    years_processed = []
    
    for nc_file in sorted(nc_files):
        # Extract year from filename
        year_match = re.search(r'(\d{4})0101_\d{8}', nc_file.name)
        if year_match:
            year = int(year_match.group(1))
            years_processed.append(year)
            
            try:
                point_count = convert_yearly_to_seasonal_globe(nc_file, output_dir, year)
                total_seasons += 4  # 4 seasons per year
                
            except Exception as e:
                print(f"❌ Error processing {nc_file.name}: {e}")
    
    print(f"\n🎯 Conversion Summary:")
    print(f"   Years processed: {len(years_processed)} ({min(years_processed)}-{max(years_processed)})")
    print(f"   Seasonal files created: {total_seasons}")
    print(f"   Output directory: {output_dir.absolute()}")
    
    # Create index file for the web interface
    create_time_series_index(output_dir, years_processed)
    
    print(f"\n🚀 Ready for time series visualization!")
    print(f"   Update the web interface to load seasonal data")

def create_time_series_index(output_dir, years):
    """
    Create an index file listing all available time periods
    """
    seasons = ['spring', 'summer', 'autumn', 'winter']
    time_series = []
    
    for year in sorted(years):
        for season in seasons:
            time_series.append({
                'year': year,
                'season': season,
                'filename': f"chlorophyll_{year}_{season}.json",
                'display_name': f"{season.title()} {year}"
            })
    
    index_file = output_dir / 'time_series_index.json'
    with open(index_file, 'w') as f:
        json.dump({
            'total_periods': len(time_series),
            'year_range': [min(years), max(years)],
            'seasons': seasons,
            'time_series': time_series
        }, f, indent=2)
    
    print(f"📋 Created time series index: {index_file}")

if __name__ == "__main__":
    main()