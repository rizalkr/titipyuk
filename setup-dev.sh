#!/bin/bash

# TitipYuk Semarang - Development Setup Script
echo "🚀 Setting up TitipYuk Semarang development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start Supabase local development
echo "🔧 Starting Supabase local development environment..."
npx supabase start

# Check if successful
if [ $? -eq 0 ]; then
    echo "✅ Supabase is running locally!"
    echo ""
    echo "🔗 Local development URLs:"
    echo "   API URL: http://localhost:54321"
    echo "   DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
    echo "   Studio URL: http://localhost:54323"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the local API URL and anon key to your .env.local file"
    echo "2. Run 'npm run dev' to start the Next.js application"
    echo "3. Visit http://localhost:3000 to see your app"
    echo ""
    echo "📊 To view your database schema, visit Supabase Studio:"
    echo "   http://localhost:54323"
else
    echo "❌ Failed to start Supabase. Please check the error messages above."
    exit 1
fi
