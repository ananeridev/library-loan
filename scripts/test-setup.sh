#!/bin/bash

# Test setup script for GitHub Actions
set -e

echo "🚀 Setting up test environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Setup test database
echo "🗄️ Setting up test database..."
npx prisma db push --force-reset

# Run seed if needed
echo "🌱 Seeding test database..."
npx prisma db seed

echo "✅ Test environment ready!"
