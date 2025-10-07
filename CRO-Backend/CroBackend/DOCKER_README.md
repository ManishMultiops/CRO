# Docker Deployment Guide for CRO Backend

This README explains how to deploy the CRO Backend application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Environment Variables

Make sure your `.env` file contains the following variables:

```
# Django settings
SECRET_KEY=your_secret_key
DJANGO_DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings
DB_NAME=cro_db
DB_USER=cro_user
DB_PASSWORD=your_secure_password
DB_HOST=db
DB_PORT=5432

# Optional: Django superuser creation on startup
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=your_secure_admin_password

# Web port
WEB_PORT=8000
```

## Quick Start

1. Clone the repository and navigate to the CroBackend directory:

```bash
git clone <repository-url>
cd CRO-Backend/CroBackend
```

2. Make sure your `.env` file is set up with the required environment variables.

3. Build and start the containers:

```bash
docker-compose up -d
```

4. Your application should now be running at http://localhost:8000 (or the port you specified in WEB_PORT).

## Configuration Options

### Using a Different Database

By default, the setup uses PostgreSQL. If you need to use a different database:

1. Update the database settings in your `.env` file
2. Modify the `docker-compose.yml` file to use a different database image
3. Update the entrypoint.sh script if necessary

### Production Deployment Considerations

For production environments:

1. Set `DJANGO_DEBUG=False` in your `.env` file
2. Configure proper `ALLOWED_HOSTS` for your domain
3. Set up proper SSL/TLS termination (consider using Nginx as a reverse proxy)
4. Use strong, unique passwords for all services
5. Consider using Docker secrets for sensitive information

## Docker Commands Reference

- Start the containers: `docker-compose up -d`
- View logs: `docker-compose logs -f`
- Stop the containers: `docker-compose down`
- Rebuild the containers: `docker-compose up -d --build`
- Remove volumes (caution - this will delete data): `docker-compose down -v`

## Troubleshooting

### Container Doesn't Start

Check the logs:

```bash
docker-compose logs -f web
```

### Database Connection Issues

Verify that your database container is running:

```bash
docker-compose ps
```

Check database logs:

```bash
docker-compose logs db
```

### Migrations Not Applied

You can manually apply migrations:

```bash
docker-compose exec web python manage.py migrate
```

## Extending This Setup

This basic setup can be extended in several ways:

- Add Nginx for SSL termination and serving static files
- Set up Celery for asynchronous task processing
- Add Redis for caching
- Implement Docker Swarm or Kubernetes for orchestration