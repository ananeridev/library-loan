#!/bin/bash

# Script de setup para testes no GitHub Actions
set -e

echo "🚀 Setting up test environment..."

# Instalar dependências
echo "📦 Installing dependencies..."
npm ci

# Gerar cliente Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate

# Configurar banco de dados de teste
echo "🗄️ Setting up test database..."
npx prisma db push --force-reset

# Executar seed se necessário
echo "🌱 Seeding test database..."
npx prisma db seed

echo "✅ Test environment ready!"
