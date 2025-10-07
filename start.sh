#!/bin/bash

# CRO Phase 2 Full-Stack Start Script for Railpack
# This script starts the applications directly without Docker

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

print_header "CRO Phase 2 Full-Stack Start"
echo "Starting applications directly (Railpack environment)"

# Install dependencies and start backend
print_header "Starting Backend Service"
cd CRO-Backend

# Detect backend type and start accordingly
if [ -f "package.json" ]; then
    print_info "Node.js backend detected"
    npm install
    # Use Railpack's provided PORT or default to 5000
    PORT=${PORT:-5000} npm start &
    BACKEND_PID=$!
    print_success "Backend starting on port ${PORT:-5000}"

elif [ -f "requirements.txt" ]; then
    print_info "Python backend detected"
    pip install -r requirements.txt
    python app.py &
    BACKEND_PID=$!
    print_success "Python backend starting"

elif [ -f "pom.xml" ]; then
    print_info "Java backend detected"
    mvn spring-boot:run &
    BACKEND_PID=$!
    print_success "Java backend starting"

else
    print_error "Could not determine backend type"
    exit 1
fi

# Install dependencies and start frontend
print_header "Starting Frontend Service"
cd ../cro-phase2-frontend

if [ -f "package.json" ]; then
    print_info "Node.js frontend detected"
    npm install

    # Check if it's a production build or development server
    if [ -f "build" ] || [ -d "dist" ]; then
        # Production build exists - serve static files
        npm install -g serve
        serve -s build -l 3000 &
        FRONTEND_PID=$!
        print_success "Frontend serving production build on port 3000"
    else
        # Development mode
        PORT=3000 npm start &
        FRONTEND_PID=$!
        print_success "Frontend starting in development mode on port 3000"
    fi
else
    print_error "Could not determine frontend type"
    exit 1
fi

print_header "Application Status"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Applications are starting up..."
echo "They should be available shortly."

# Wait for both processes
print_header "Monitoring Services"
echo "Press Ctrl+C to stop all services"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    print_header "Shutting down services"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_success "All services stopped"
    exit 0
}

trap cleanup SIGINT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
