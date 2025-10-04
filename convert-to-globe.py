#!/usr/bin/env python3
"""
Convert MODIS Chlorophyll NetCDF to WebGL Globe JSON format
"""

import numpy as np
import json
from pathlib import Path
from netCDF4 import Dataset

def convert_chlorophyll_to_globe(nc_file, output_file, subsample_factor=4, max_points=50000):
    """
    Convert MODIS chlorophyll NetCDF to WebGL Globe format
    """
    print(f"🌊 Converting {nc_file} to WebGL Globe format...")
    
    with Dataset(nc_file, 'r') as nc:
        # Load data
        lat = nc.variables['lat'][:]
        lon = nc.variables['lon'][:]
        chlor_a = nc.variables['chlor_a'][:]
        
        print(f"📊 Original data shape: {chlor_a.shape}")
        print(f"📍 Lat range: {lat.min():.2f}° to {lat.max():.2f}°")
        print(f"📍 Lon range: {lon.min():.2f}° to {lon.max():.2f}°")
        
        # Handle masked data
        if hasattr(chlor_a, 'mask'):
            plot_data = np.ma.filled(chlor_a, np.nan)
        else:
            plot_data = chlor_a
        
        # Subsample for performance
        lat_sub = lat[::subsample_factor]
        lon_sub = lon[::subsample_factor]
        chlor_sub = plot_data[::subsample_factor, ::subsample_factor]
        
        print(f"📊 Subsampled shape: {chlor_sub.shape}")
        
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
        
        # Further subsample if too many points
        if len(chlor_valid) > max_points:
            indices = np.random.choice(len(chlor_valid), max_points, replace=False)
            lat_valid = lat_valid[indices]
            lon_valid = lon_valid[indices]
            chlor_valid = chlor_valid[indices]
            print(f"📉 Subsampled to: {len(chlor_valid):,} points for web performance")
        
        # Simple normalization for heatmap visualization
        # Use original values with basic percentile normalization
        chlor_min = np.percentile(chlor_valid, 5)
        chlor_max = np.percentile(chlor_valid, 95)
        chlor_norm = np.clip((chlor_valid - chlor_min) / (chlor_max - chlor_min), 0, 1)
        
        # Get original data range for metadata
        chlor_min_orig = chlor_valid.min()
        chlor_max_orig = chlor_valid.max()
        
        print(f"📈 Original data range: {chlor_min_orig:.4f} - {chlor_max_orig:.4f} mg/m³")
        print(f"📈 Normalization range: {chlor_min:.4f} - {chlor_max:.4f} mg/m³")
        print(f"📈 Normalized range: {chlor_norm.min():.3f} - {chlor_norm.max():.3f}")
        
        # Create WebGL Globe data array: [lat, lon, magnitude, lat, lon, magnitude, ...]
        globe_data_array = []
        for i in range(len(lat_valid)):
            globe_data_array.extend([float(lat_valid[i]), float(lon_valid[i]), float(chlor_norm[i])])
        
        # Create metadata
        metadata = {
            'source': str(nc_file),
            'points': len(lat_valid),
            'chlor_range': [float(chlor_min_orig), float(chlor_max_orig)],
            'date_range': getattr(nc, 'time_coverage_start', 'Unknown'),
            'resolution': f"{abs(lat[1] - lat[0]):.3f}°",
            'subsample_factor': subsample_factor
        }
        
        # Create final JSON structure
        globe_data = [
            ["Chlorophyll_MODIS", globe_data_array]
        ]
        
        # Save JSON file
        with open(output_file, 'w') as f:
            json.dump(globe_data, f, separators=(',', ':'))
        
        print(f"✅ Saved to: {output_file}")
        print(f"📁 File size: {Path(output_file).stat().st_size / 1024:.1f} KB")
        
        return metadata

def main():
    print("🌊 MODIS Chlorophyll to WebGL Globe Converter")
    print("=" * 50)
    
    # Input file
    input_file = Path("chlorophyll_data/AQUA_MODIS.20020801_20020831.L3m.MO.CHL.chlor_a.4km.nc")
    
    if not input_file.exists():
        print(f"❌ Input file not found: {input_file}")
        print("💡 Make sure you have downloaded the chlorophyll data")
        return
    
    # Output file
    output_file = Path("chlorophyll-globe/chlorophyll_data.json")
    
    try:
        metadata = convert_chlorophyll_to_globe(input_file, output_file)
        
        print(f"\n🎯 Conversion Summary:")
        print(f"   Source: {metadata['source']}")
        print(f"   Data points: {metadata['points']:,}")
        print(f"   Chlorophyll range: {metadata['chlor_range'][0]:.4f} - {metadata['chlor_range'][1]:.4f} mg/m³")
        print(f"   Date: {metadata['date_range']}")
        print(f"   Resolution: {metadata['resolution']}")
        
        print(f"\n🚀 Ready to visualize!")
        print(f"   1. Open chlorophyll-globe/index.html in browser")
        print(f"   2. Start local server: python -m http.server 8000")
        print(f"   3. Navigate to: http://localhost:8000/chlorophyll-globe/")
        
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()