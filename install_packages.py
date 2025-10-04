#!/usr/bin/env python3
"""
Install required packages for chlorophyll analysis
"""

import subprocess
import sys

packages = [
    'numpy',
    'matplotlib', 
    'netCDF4',
    'pandas',
    'seaborn'
]

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def main():
    print("🔧 Installing required packages for chlorophyll analysis...")
    print("=" * 50)
    
    successful = 0
    
    for package in packages:
        print(f"Installing {package}...")
        if install_package(package):
            successful += 1
    
    print(f"\n📊 Installation Summary:")
    print(f"   Successful: {successful}/{len(packages)}")
    
    if successful == len(packages):
        print(f"🎉 All packages installed successfully!")
        print(f"🚀 You can now run the Chlorophyll_Visualiser.ipynb notebook")
    else:
        print(f"⚠️  Some packages failed to install.")
        print(f"💡 Try running manually: pip install numpy matplotlib netCDF4 pandas seaborn")

if __name__ == "__main__":
    main()