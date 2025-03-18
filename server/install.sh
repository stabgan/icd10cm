#!/bin/bash

# Script to help setup Elasticsearch and the ICD-10-CM API server

echo "=== ICD-10-CM Elasticsearch Setup ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "Starting Elasticsearch container..."
docker run -d --name icd10cm-elasticsearch \
    -p 9200:9200 -p 9300:9300 \
    -e "discovery.type=single-node" \
    -e "xpack.security.enabled=false" \
    docker.elastic.co/elasticsearch/elasticsearch:8.12.0

echo "Waiting for Elasticsearch to start..."
sleep 20

echo "Installing Node.js dependencies..."
npm install

echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created with default settings"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To index your data, run:"
echo "  npm run index"
echo ""
echo "To start the API server, run:"
echo "  npm run dev"
echo ""
echo "Elasticsearch is accessible at: http://localhost:9200"
echo "API server will be accessible at: http://localhost:5000" 