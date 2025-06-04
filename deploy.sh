#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to fly.io..."

# Install flyctl if not already installed
if ! command -v flyctl &> /dev/null; then
    echo "Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to fly.io
echo "🚀 Deploying to fly.io..."
flyctl deploy

echo "✅ Deployment complete!"
echo "Your application is now available at https://soundgrab.fly.dev"