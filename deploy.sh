#!/usr/bin/env bash

# Exit on any error
set -e

# Build the project
echo "Building the project..."
npm run build

# Navigate to the dist folder
cd dist

# Create a .nojekyll file to prevent Jekyll processing
touch .nojekyll

# Initialize Git in the dist folder
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch
git push -f https://github.com/stabgan/icd10cm.git master:gh-pages

# Go back to the previous directory
cd ..

echo "Successfully deployed to GitHub Pages!" 