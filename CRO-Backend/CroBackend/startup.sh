#!/bin/bash

# Backend startup script for CRO Phase 2
# This script handles startup procedures for the Django backend

set -e

# Function for logging with timestamp
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Wait for the database to be available
wait_for_database() {
  log "Waiting for PostgreSQL at ${DB_HOST:-db}:${DB_PORT:-5432}..."

  # Use a timeout mechanism
  TIMEOUT=60
  COUNT=0

  while ! pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-cro_user}" > /dev/null 2>&1; do
    sleep 2
    COUNT=$((COUNT+2))
    if [ $COUNT -ge $TIMEOUT ]; then
      log "ERROR: Timed out waiting for PostgreSQL after ${TIMEOUT}s"
      log "Falling back to netcat check..."

      # Try netcat as a fallback
      if nc -z "${DB_HOST:-db}" "${DB_PORT:-5432}"; then
        log "PostgreSQL port is open (via netcat)"
        break
      else
        log "ERROR: Could not connect to PostgreSQL. Exiting."
        exit 1
      fi
    fi

    if [ $((COUNT % 10)) -eq 0 ]; then
      log "Still waiting for PostgreSQL... ${COUNT}/${TIMEOUT}s"
    fi
  done

  log "PostgreSQL is available!"

  # Extra sleep to ensure PostgreSQL is fully initialized
  sleep 3
}

# Run database migrations
run_migrations() {
  log "Applying database migrations..."
  python manage.py migrate

  if [ $? -ne 0 ]; then
    log "ERROR: Database migration failed!"
    log "Detailed database information:"
    log "  DATABASE_NAME: ${DATABASE_NAME:-Not set} / DB_NAME: ${DB_NAME:-Not set}"
    log "  DATABASE_USER: ${DATABASE_USER:-Not set} / DB_USER: ${DB_USER:-Not set}"
    log "  DATABASE_HOST: ${DATABASE_HOST:-Not set} / DB_HOST: ${DB_HOST:-Not set}"
    log "  DATABASE_PORT: ${DATABASE_PORT:-Not set} / DB_PORT: ${DB_PORT:-Not set}"
    return 1
  fi

  log "Migrations applied successfully"
  return 0
}

# Collect static files
collect_static() {
  log "Collecting static files..."
  python manage.py collectstatic --noinput

  if [ $? -ne 0 ]; then
    log "WARNING: Failed to collect static files. Continuing anyway..."
  else
    log "Static files collected successfully"
  fi
}

# Create superuser if environment variables are set
create_superuser() {
  if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    log "Creating superuser..."
    python manage.py createsuperuser --noinput

    if [ $? -ne 0 ]; then
      log "WARNING: Failed to create superuser. It might already exist."
    else
      log "Superuser created successfully"
    fi
  fi
}

# Start the Django development server
start_server() {
  log "Starting Django server..."
  exec python manage.py runserver 0.0.0.0:8000
}

# Display environment information
log "Starting CRO Backend with the following configuration:"
log "  DEBUG: ${DEBUG:-Not set}"
log "  DB_HOST: ${DB_HOST:-Not set}"
log "  DB_PORT: ${DB_PORT:-Not set}"
log "  DB_NAME: ${DB_NAME:-Not set}"
log "  DATABASE_HOST: ${DATABASE_HOST:-Not set}"
log "  DATABASE_PORT: ${DATABASE_PORT:-Not set}"
log "  DATABASE_NAME: ${DATABASE_NAME:-Not set}"

# Main execution flow
wait_for_database
run_migrations
collect_static
create_superuser
start_server
