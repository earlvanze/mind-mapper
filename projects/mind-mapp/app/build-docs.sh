#!/bin/bash
# Build documentation site

set -e

echo "Building Mind Mapp documentation..."

# Create docs directory
mkdir -p docs

# Copy all markdown files
echo "Copying documentation files..."
cp *.md docs/ 2>/dev/null || true

# Copy index.html if it exists in docs/
if [ ! -f docs/index.html ]; then
    echo "Error: docs/index.html not found"
    exit 1
fi

echo "Documentation built successfully in docs/"
echo "Files: $(ls docs/ | wc -l)"

# Optionally copy to dist for deployment
if [ "$1" = "--to-dist" ]; then
    echo "Copying docs to dist/docs..."
    mkdir -p dist/docs
    cp -r docs/* dist/docs/
    echo "Documentation available at /docs/"
fi
