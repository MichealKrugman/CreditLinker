#!/bin/bash

echo "🚀 Starting CreditLinker Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from your configuration..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://creditlink:creditlink_password@localhost:5432/creditlink?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="0vRSvsyBMm+f9QntwckrgT5ahTabO08U6AhfLeSpEfQ="

# MinIO Configuration (Object Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="creditlink_minio"
MINIO_SECRET_KEY="creditlink_minio_secret_key_2024"
MINIO_USE_SSL="false"
MINIO_BUCKET_NAME="creditlink-documents"

# Redis Configuration (Caching)
REDIS_URL="redis://localhost:6379"

# Storage Configuration
STORAGE_PROVIDER="minio"
LOCAL_STORAGE_PATH="./uploads"

# Application Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="CreditLink"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
    echo "✅ .env file created"
fi

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking services..."
docker-compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "   PostgreSQL: localhost:5432"
echo "   MinIO API: http://localhost:9000"
echo "   MinIO Console: http://localhost:9001"
echo "   Redis: localhost:6379"
echo ""
echo "🔑 MinIO Console Login:"
echo "   Username: creditlink_minio"
echo "   Password: creditlink_minio_secret_key_2024"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npx prisma generate"
echo "3. Run: npx prisma db push"
echo "4. Run: npm run dev"
echo ""
