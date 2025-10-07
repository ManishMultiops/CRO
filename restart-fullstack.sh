#!/bin/bash

# CRO Phase 2 Full-Stack Restart Script
# This script performs a complete restart of the CRO Phase 2 stack,
# with proper error handling and sequential service startup

# Set up colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}==== $1 ====${NC}"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print informational messages
print_info() {
  echo -e "${BLUE}$1${NC}"
}

# Function to handle script exit
cleanup() {
  echo ""
  print_header "Cleaning up"
  print_info "Script interrupted. Shutting down any running containers..."
  docker-compose down --remove-orphans
  echo ""
  exit 1
}

# Trap Ctrl+C to enable clean shutdown
trap cleanup SIGINT

print_header "CRO Phase 2 Full-Stack Restart"
print_info "This script will restart the entire CRO Phase 2 stack (frontend, backend, and database)"

# Check if Docker is running
print_header "Checking prerequisites"
if ! docker info > /dev/null 2>&1; then
  print_error "Docker is not running. Please start Docker and try again."
  exit 1
fi
print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
  print_error "docker-compose is not installed or not in PATH"
  exit 1
fi
print_success "docker-compose is available"

# Stop any running containers
print_header "Stopping all services"
print_info "Stopping all containers..."
docker-compose down --remove-orphans

# Make scripts executable
print_header "Preparing scripts"
print_info "Setting executable permissions on scripts..."
chmod +x CRO-Backend/CroBackend/startup.sh 2>/dev/null || true
print_success "Scripts prepared"

# Remove stale volumes if requested
read -p "Do you want to remove database volumes and start fresh? (y/N): " remove_volumes
if [[ "$remove_volumes" =~ ^[Yy]$ ]]; then
  print_header "Removing volumes"
  print_info "Removing database volumes..."
  docker-compose down -v
  print_success "Volumes removed"
fi

# Build images
print_header "Building images"
print_info "Building all services..."
docker-compose build

if [ $? -ne 0 ]; then
  print_error "Build failed! Please check the error messages above."
  exit 1
fi
print_success "Images built successfully"

# Start the database first
print_header "Starting database service"
print_info "Starting PostgreSQL container..."
docker-compose up -d db

if [ $? -ne 0 ]; then
  print_error "Failed to start database container!"
  exit 1
fi
print_success "Database container started"

# Wait for database to be ready
print_info "Waiting for database to initialize (15s)..."
for i in {1..15}; do
  echo -n "."
  sleep 1
done
echo ""

# Start the backend
print_header "Starting backend service"
print_info "Starting backend container..."
docker-compose up -d backend

if [ $? -ne 0 ]; then
  print_error "Failed to start backend container!"
  exit 1
fi

# Check if backend is healthy
print_info "Waiting for backend to become ready..."
retries=0
max_retries=30
while [ $retries -lt $max_retries ]; do
  if docker-compose ps | grep backend | grep -q "(healthy)"; then
    break
  fi
  echo -n "."
  sleep 2
  retries=$((retries + 1))
done
echo ""

if [ $retries -ge $max_retries ]; then
  print_info "Backend may not be fully healthy yet, but continuing..."
else
  print_success "Backend is ready"
fi

# Start the frontend
print_header "Starting frontend service"
print_info "Starting frontend container..."
docker-compose up -d frontend

if [ $? -ne 0 ]; then
  print_error "Failed to start frontend container!"
  exit 1
fi
print_success "Frontend container started"

# Check the status of all services
print_header "Service status"
docker-compose ps

# Print success message and URLs
print_header "Startup complete"
print_success "All services have been started successfully!"
echo ""
echo "You can access your applications at:"
echo "• Frontend: http://localhost:80"
echo "• Backend API: http://localhost:8000"
echo ""
echo "To view logs: docker-compose logs -f [service]"
echo "Available services: frontend, backend, db"
echo ""
echo "To stop all services: docker-compose down"

# Ask if user wants to tail logs
read -p "Do you want to view the logs? (y/N): " view_logs
if [[ "$view_logs" =~ ^[Yy]$ ]]; then
  print_header "Service logs"
  print_info "Showing logs (press Ctrl+C to exit)..."
  docker-compose logs -f
fi

exit 0
