#!/usr/bin/env python3
"""
Convert Movebank whale shark CSV data to WebGL Globe JSON format
Creates time series data for whale shark tracking in Gulf of Mexico
"""

import pandas as pd
import json
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import colorsys

def load_whale_shark_data(csv_file):
    """
    Load and parse whale shark tracking data from Movebank CSV format
    """
    print(f"🦈 Loading whale shark data from {csv_file}...")
    
    # Read CSV with proper data types
    df = pd.read_csv(csv_file)
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['study-local-timestamp'] = pd.to_datetime(df['study-local-timestamp'])
    
    # Filter only visible GPS data
    df = df[df['visible'] == True]
    df = df[df['sensor-type'] == 'gps']
    
    # Remove rows with missing coordinates
    df = df.dropna(subset=['location-long', 'location-lat'])
    
    print(f"📊 Loaded {len(df):,} GPS tracking points")
    print(f"🦈 Unique sharks: {df['individual-local-identifier'].nunique()}")
    print(f"📅 Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    return df

def generate_shark_colors(shark_ids):
    """
    Generate distinct colors for each shark using HSL color space
    """
    colors = {}
    num_sharks = len(shark_ids)
    
    for i, shark_id in enumerate(sorted(shark_ids)):
        # Distribute hues evenly around color wheel
        hue = i / num_sharks
        # Use high saturation and medium lightness for visibility
        saturation = 0.8
        lightness = 0.6
        
        # Convert HSL to RGB
        rgb = colorsys.hls_to_rgb(hue, lightness, saturation)
        # Convert to 0-255 range
        colors[shark_id] = [int(r * 255) for r in rgb]
    
    return colors

def create_shark_tracks(df):
    """
    Organize tracking data by individual sharks
    """
    sharks = {}
    shark_ids = df['individual-local-identifier'].unique()
    colors = generate_shark_colors(shark_ids)
    
    print(f"🎨 Generated colors for {len(shark_ids)} sharks")
    
    for shark_id in shark_ids:
        shark_data = df[df['individual-local-identifier'] == shark_id].copy()
        shark_data = shark_data.sort_values('timestamp')
        
        # Create track points array [longitude, latitude, magnitude, timestamp]
        tracks = []
        for _, row in shark_data.iterrows():
            # Use timestamp as Unix timestamp for magnitude (for temporal sorting)
            timestamp_unix = int(row['timestamp'].timestamp())
            tracks.append([
                float(row['location-long']),
                float(row['location-lat']),
                1.0,  # Magnitude (constant for now, could be speed or accuracy)
                timestamp_unix
            ])
        
        sharks[shark_id] = {
            'id': str(shark_id),
            'name': f'Whale Shark {shark_id}',
            'color': colors[shark_id],
            'tracks': tracks,
            'total_points': len(tracks),
            'date_range': [
                shark_data['timestamp'].min().isoformat(),
                shark_data['timestamp'].max().isoformat()
            ]
        }
        
        print(f"  🦈 {shark_id}: {len(tracks)} points from {shark_data['timestamp'].min().date()} to {shark_data['timestamp'].max().date()}")
    
    return sharks

def create_temporal_datasets(sharks, df):
    """
    Create time-based datasets for animation
    """
    # Get overall date range
    start_date = df['timestamp'].min()
    end_date = df['timestamp'].max()
    
    print(f"📅 Creating temporal datasets from {start_date.date()} to {end_date.date()}")
    
    # Create monthly datasets
    monthly_data = create_monthly_datasets(sharks, start_date, end_date)
    
    # Create yearly datasets
    yearly_data = create_yearly_datasets(sharks, start_date, end_date)
    
    return {
        'monthly': monthly_data,
        'yearly': yearly_data,
        'full_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        }
    }

def create_monthly_datasets(sharks, start_date, end_date):
    """
    Create monthly datasets for fine-grained temporal control
    """
    monthly_data = []
    
    # Generate monthly periods
    current_date = start_date.replace(day=1)
    while current_date <= end_date:
        next_month = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        month_sharks = []
        total_points = 0
        
        for shark_id, shark_data in sharks.items():
            # Filter tracks for this month
            month_tracks = []
            for track in shark_data['tracks']:
                track_date = datetime.fromtimestamp(track[3])
                if current_date <= track_date < next_month:
                    month_tracks.append(track)
            
            if month_tracks:
                month_sharks.append({
                    'id': shark_data['id'],
                    'name': shark_data['name'],
                    'color': shark_data['color'],
                    'tracks': month_tracks
                })
                total_points += len(month_tracks)
        
        if month_sharks:  # Only add months with data
            monthly_data.append({
                'period': current_date.strftime('%Y-%m'),
                'display_name': current_date.strftime('%B %Y'),
                'sharks': month_sharks,
                'total_points': total_points,
                'start_date': current_date.isoformat(),
                'end_date': next_month.isoformat()
            })
        
        current_date = next_month
    
    print(f"📊 Created {len(monthly_data)} monthly datasets")
    return monthly_data

def create_yearly_datasets(sharks, start_date, end_date):
    """
    Create yearly datasets for broader temporal overview
    """
    yearly_data = []
    
    for year in range(start_date.year, end_date.year + 1):
        year_start = datetime(year, 1, 1)
        year_end = datetime(year + 1, 1, 1)
        
        year_sharks = []
        total_points = 0
        
        for shark_id, shark_data in sharks.items():
            # Filter tracks for this year
            year_tracks = []
            for track in shark_data['tracks']:
                track_date = datetime.fromtimestamp(track[3])
                if year_start <= track_date < year_end:
                    year_tracks.append(track)
            
            if year_tracks:
                year_sharks.append({
                    'id': shark_data['id'],
                    'name': shark_data['name'],
                    'color': shark_data['color'],
                    'tracks': year_tracks
                })
                total_points += len(year_tracks)
        
        if year_sharks:  # Only add years with data
            yearly_data.append({
                'period': str(year),
                'display_name': str(year),
                'sharks': year_sharks,
                'total_points': total_points,
                'start_date': year_start.isoformat(),
                'end_date': year_end.isoformat()
            })
    
    print(f"📊 Created {len(yearly_data)} yearly datasets")
    return yearly_data

def save_whale_shark_data(sharks, temporal_data, output_dir):
    """
    Save whale shark data in WebGL Globe compatible format
    """
    output_dir.mkdir(exist_ok=True)
    
    # Save complete shark dataset
    complete_data = {
        'sharks': list(sharks.values()),
        'timeRange': temporal_data['full_range'],
        'totalSharks': len(sharks),
        'totalPoints': sum(len(shark['tracks']) for shark in sharks.values())
    }
    
    complete_file = output_dir / 'whale_sharks_complete.json'
    with open(complete_file, 'w') as f:
        json.dump(complete_data, f, separators=(',', ':'))
    print(f"💾 Saved complete dataset: {complete_file}")
    
    # Save monthly datasets
    monthly_dir = output_dir / 'monthly'
    monthly_dir.mkdir(exist_ok=True)
    
    for month_data in temporal_data['monthly']:
        filename = f"whale_sharks_{month_data['period']}.json"
        month_file = monthly_dir / filename
        
        # Convert to WebGL Globe format [label, data_array]
        globe_data = []
        for shark in month_data['sharks']:
            # Flatten track data for WebGL Globe
            track_array = []
            for track in shark['tracks']:
                track_array.extend([track[1], track[0], track[2]])  # lat, lon, magnitude
            
            if track_array:  # Only add if there's data
                globe_data.append([f"{shark['name']} - {month_data['display_name']}", track_array])
        
        with open(month_file, 'w') as f:
            json.dump(globe_data, f, separators=(',', ':'))
    
    print(f"💾 Saved {len(temporal_data['monthly'])} monthly files")
    
    # Save yearly datasets
    yearly_dir = output_dir / 'yearly'
    yearly_dir.mkdir(exist_ok=True)
    
    for year_data in temporal_data['yearly']:
        filename = f"whale_sharks_{year_data['period']}.json"
        year_file = yearly_dir / filename
        
        # Convert to WebGL Globe format
        globe_data = []
        for shark in year_data['sharks']:
            track_array = []
            for track in shark['tracks']:
                track_array.extend([track[1], track[0], track[2]])  # lat, lon, magnitude
            
            if track_array:
                globe_data.append([f"{shark['name']} - {year_data['display_name']}", track_array])
        
        with open(year_file, 'w') as f:
            json.dump(globe_data, f, separators=(',', ':'))
    
    print(f"💾 Saved {len(temporal_data['yearly'])} yearly files")
    
    # Create time series index
    create_time_series_index(output_dir, temporal_data)

def create_time_series_index(output_dir, temporal_data):
    """
    Create index file for time series navigation
    """
    index_data = {
        'timeRange': temporal_data['full_range'],
        'monthly': [
            {
                'period': month['period'],
                'display_name': month['display_name'],
                'filename': f"monthly/whale_sharks_{month['period']}.json",
                'total_points': month['total_points'],
                'shark_count': len(month['sharks'])
            }
            for month in temporal_data['monthly']
        ],
        'yearly': [
            {
                'period': year['period'],
                'display_name': year['display_name'],
                'filename': f"yearly/whale_sharks_{year['period']}.json",
                'total_points': year['total_points'],
                'shark_count': len(year['sharks'])
            }
            for year in temporal_data['yearly']
        ]
    }
    
    index_file = output_dir / 'time_series_index.json'
    with open(index_file, 'w') as f:
        json.dump(index_data, f, indent=2)
    
    print(f"📋 Created time series index: {index_file}")

def main():
    print("🦈 Whale Shark Tracking Data Converter")
    print("=" * 50)
    
    # Input and output paths
    input_file = Path("whale-shark-data/whale-shark-data.csv")
    output_dir = Path("whale-shark-json-files/whale-shark-json")
    
    if not input_file.exists():
        print(f"❌ Input file not found: {input_file}")
        return
    
    try:
        # Load and process data
        df = load_whale_shark_data(input_file)
        sharks = create_shark_tracks(df)
        temporal_data = create_temporal_datasets(sharks, df)
        
        # Save processed data
        save_whale_shark_data(sharks, temporal_data, output_dir)
        
        print(f"\n🎯 Conversion Summary:")
        print(f"   Total sharks: {len(sharks)}")
        print(f"   Total tracking points: {len(df):,}")
        print(f"   Date range: {temporal_data['full_range']['start'][:10]} to {temporal_data['full_range']['end'][:10]}")
        print(f"   Monthly datasets: {len(temporal_data['monthly'])}")
        print(f"   Yearly datasets: {len(temporal_data['yearly'])}")
        print(f"   Output directory: {output_dir.absolute()}")
        
        print(f"\n🚀 Ready for whale shark visualization!")
        
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()