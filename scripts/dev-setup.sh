#!/bin/bash

echo "🐳 Setting up development environment..."

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

echo "🚀 Starting PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres

echo "⏳ Waiting for PostgreSQL..."
sleep 10

export DATABASE_URL="postgresql://postgres:password@localhost:5433/library_loans?schema=public"

echo "✅ PostgreSQL running on port 5433"
echo "🔧 Setting up database..."

npm run prisma:db:push

echo "🌱 Seeding database with sample data..."
npm run prisma:seed

echo "🎉 Environment ready! Run 'npm run start:dev' to start the application"
echo "📖 Swagger: http://localhost:3000/api"
echo "🗄️  Prisma Studio: npm run prisma:studio"
