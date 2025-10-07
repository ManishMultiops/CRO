#!/bin/bash

# Wait for PostgreSQL to be available
echo "Waiting for PostgreSQL..."

# Ensure we have netcat available
if ! command -v nc &> /dev/null; then
  echo "Installing netcat..."
  apt-get update && apt-get install -y netcat-openbsd
fi

# Wait for PostgreSQL with a timeout
TIMEOUT=60  # Increased timeout
COUNT=0
while true; do
  # Try using pg_isready if available
  if command -v pg_isready &> /dev/null; then
    if pg_isready -h ${DATABASE_HOST:-db} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-cro_user}; then
      echo "PostgreSQL is ready (via pg_isready)"
      break
    fi
  else
    # Fallback to netcat
    if nc -z ${DATABASE_HOST:-db} ${DATABASE_PORT:-5432}; then
      echo "PostgreSQL port is open (via netcat)"
      # Add a small delay to ensure PostgreSQL is fully initialized
      sleep 3
      break
    fi
  fi

  sleep 2
  COUNT=$((COUNT+2))
  if [ $COUNT -ge $TIMEOUT ]; then
    echo "Error: Timed out waiting for PostgreSQL to start after ${TIMEOUT}s"
    echo "Please check your database configuration and ensure PostgreSQL is running."
    exit 1
  fi
  echo "Waiting for PostgreSQL... ${COUNT}/${TIMEOUT}s"
done
echo "PostgreSQL is available!"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate || {
  echo "Error: Database migration failed!"
  echo "Please check your database settings and ensure database connection is working."
  exit 1
}

# Create superuser if DJANGO_SUPERUSER_USERNAME is set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  echo "Creating superuser..."
  python manage.py createsuperuser --noinput
fi

# Collect static files
echo "Collecting static files..."
mkdir -p static
python manage.py collectstatic --noinput || {
  echo "Warning: Failed to collect static files. Continuing anyway..."
}

# Start server
echo "Starting server..."
if [ "$DJANGO_DEBUG" = "False" ] || [ "$DJANGO_DEBUG" = "false" ]; then
  # Production - use gunicorn
  echo "Starting Gunicorn in production mode..."
  gunicorn CroBackend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
else
  # Development - use Django's runserver
  echo "Starting Django development server..."
  python manage.py runserver 0.0.0.0:8000
fi
