#!/bin/bash

# Enhanced Google Docs Clone - Setup Script
# This script helps you set up the project quickly

echo "🚀 Enhanced Google Docs Clone - Setup Script"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.0 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm is available"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo ""
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ .env.local created from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your OpenAI API key"
    echo "   1. Get your API key from: https://platform.openai.com/api-keys"
    echo "   2. Replace 'your_openai_api_key_here' with your actual API key"
    echo "   3. Save the file"
else
    echo "✅ .env.local already exists"
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env.local 2>/dev/null; then
    echo ""
    echo "⚠️  WARNING: OpenAI API key not configured"
    echo "   Please edit .env.local and add your OpenAI API key for AI features to work"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your OpenAI API key (if not done already)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see the README.md file"
echo ""
echo "Happy coding! 🚀✨"