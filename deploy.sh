#!/bin/bash

# FlowGuard AI - Setup & Deployment Script

set -e

echo "🚀 FlowGuard AI - Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is not installed${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Create environment file
echo -e "${YELLOW}[2/6] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file (please update with your values)${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Build images
echo -e "${YELLOW}[3/6] Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Docker images built successfully${NC}"

# Start services
echo -e "${YELLOW}[4/6] Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}[5/6] Waiting for services to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}[6/6] Running database migrations...${NC}"
docker-compose exec -T postgres psql -U flowguard -d flowguard -f /docker-entrypoint-initdb.d/database-schema.sql
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Print deployment summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ FlowGuard AI deployment completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services running on:"
echo "  API Gateway:      http://localhost:8080"
echo "  Frontend:         http://localhost:3000"
echo "  RabbitMQ Admin:   http://localhost:15672"
echo "  Grafana:          http://localhost:3000"
echo "  Prometheus:       http://localhost:9090"
echo ""
echo "Default credentials:"
echo "  RabbitMQ:  flowguard / flowguard_secure_password"
echo "  Grafana:   admin / admin"
echo ""
echo "Next steps:"
echo "  1. Update .env with your OpenAI API key"
echo "  2. Configure Slack webhooks"
echo "  3. Access frontend at http://localhost:3000"
echo ""
