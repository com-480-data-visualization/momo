#!/bin/bash

# Sync Nobel laureates data file to docs directory for GitHub Pages
echo "Syncing nobel_laureates_data.csv to docs directory..."

# Check if source file exists
if [ -f "nobel_laureates_data.csv" ]; then
    # Copy the file to docs directory
    cp nobel_laureates_data.csv docs/
    echo "✅ Data file synchronized successfully!"
    echo "Source: nobel_laureates_data.csv"
    echo "Target: docs/nobel_laureates_data.csv"
else
    echo "❌ Error: nobel_laureates_data.csv not found in project root!"
    exit 1
fi

# Show file info
echo ""
echo "File information:"
ls -lh nobel_laureates_data.csv docs/nobel_laureates_data.csv 