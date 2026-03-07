#!/bin/bash

echo "🚀 Starting Deployment Process..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies (in case package.json changed)
echo "📦 Installing dependencies..."
npm install

# 3. Clean old build
echo "🧹 Cleaning old build..."
rm -rf .next

# 4. Build project
echo "🏗️  Building project..."
npm run build

# 5. Prepare Standalone Directory (CRITICAL STEP)
echo "📂 Copying static assets to standalone..."
# Ensure destination exists
mkdir -p .next/standalone/.next/static
mkdir -p .next/standalone/public

# Copy static files
cp -r .next/static/* .next/standalone/.next/static/
cp -r public/* .next/standalone/public/

# 6. Restart PM2
echo "🔄 Restarting PM2..."
PORT=3018 pm2 restart lastnote18

echo "✅ Deployment Complete! Website should be live."
