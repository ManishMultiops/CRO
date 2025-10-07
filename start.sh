#!/bin/bash

# CRO Phase 2 Full-Stack Start Script for Railpack
# Django Backend + React Frontend

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

print_header "CRO Phase 2 Full-Stack Start"
echo "Starting Django Backend + React Frontend"

# Start backend - Django
print_header "Starting Django Backend"
cd CRO-Backend/CroBackend

# Check for Django in the correct subdirectory
if [ -f "manage.py" ] && [ -f "requirements.txt" ]; then
    print_info "Django backend detected in CRO-Backend/CroBackend/"

    # Install Python dependencies
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt

    # Run database migrations
    print_info "Running database migrations..."
    python manage.py migrate --noinput

    # Collect static files
    print_info "Collecting static files..."
    python manage.py collectstatic --noinput

    # Start Django development server
    print_info "Starting Django server..."
    # Use Railpack's PORT or default to 8000 for Django
    python manage.py runserver 0.0.0.0:${PORT:-8000} &
    BACKEND_PID=$!
    print_success "Django backend starting on port ${PORT:-8000}"

else
    print_error "Could not find Django backend files"
    echo "Looking for: CRO-Backend/CroBackend/manage.py and requirements.txt"
    echo "Current directory: $(pwd)"
    echo "Files found:"
    ls -la
    exit 1
fi

# Start frontend - React
print_header "Starting React Frontend"
cd ../../cro-phase2-frontend

if [ -f "package.json" ]; then
    print_info "React frontend detected"

    # Install Node.js dependencies
    print_info "Installing Node.js dependencies..."
    npm install

    # Check if we should build for production or run dev server
    if [ "$RAILPACK_ENV" = "production" ] || [ "$NODE_ENV" = "production" ]; then
        print_info "Building React app for production..."
        npm run build

        # Serve the built files
        print_info "Serving production build..."
        npm install -g serve
        serve -s build -l 3000 &
        FRONTEND_PID=$!
        print_success "React frontend serving production build on port 3000"
    else
        print_info "Starting React development server..."
        # Use a different port for frontend development
        PORT=3000 npm start &
        FRONTEND_PID=$!
        print_success "React frontend starting in development mode on port 3000"
    fi

else
    print_error "Could not find React frontend (no package.json)"
    echo "Current directory: $(pwd)"
    echo "Files found:"
    ls -la
    exit 1
fi

print_header "Application Status"
echo "Backend (Django) PID: $BACKEND_PID"
echo "Frontend (React) PID: $FRONTEND_PID"
echo ""
echo "Services starting up..."
echo "Backend API: http://localhost:${PORT:-8000}"
echo "Frontend: http://localhost:3000"
echo ""
echo "Use 'ps aux' to check running processes"

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
