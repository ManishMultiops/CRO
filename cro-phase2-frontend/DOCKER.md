# Docker Deployment Guide for CRO Frontend Application

This document provides instructions on how to deploy the CRO frontend application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system (optional, but recommended)

## Deployment Options

There are two main ways to deploy the application:

1. Using Docker directly
2. Using Docker Compose (recommended)

## Option 1: Using Docker

### Building the Docker Image

```bash
# Navigate to the project directory
cd cro-phase2-frontend

# Build the Docker image
docker build -t cro-frontend .
```

### Running the Container

```bash
# Run the container
docker run -d -p 80:80 --name cro-frontend-app cro-frontend
```

The application will be available at http://localhost.

### Stopping the Container

```bash
docker stop cro-frontend-app
```

### Removing the Container

```bash
docker rm cro-frontend-app
```

## Option 2: Using Docker Compose (Recommended)

### Deployment

```bash
# Navigate to the project directory
cd cro-phase2-frontend

# Start the application
docker-compose up -d
```

The application will be available at http://localhost.

### Stopping the Application

```bash
docker-compose down
```

## Environment Variables

If your application requires environment variables (like API URLs), you can configure them in two ways:

1. **Using Docker:**

```bash
docker run -d -p 80:80 \
  -e REACT_APP_API_URL=http://api.example.com \
  --name cro-frontend-app cro-frontend
```

2. **Using Docker Compose:**

Uncomment and update the environment variables section in the `docker-compose.yml` file:

```yaml
environment:
  - REACT_APP_API_URL=http://your-api-url
```

## Troubleshooting

### Checking Container Logs

```bash
# If using Docker directly
docker logs cro-frontend-app

# If using Docker Compose
docker-compose logs frontend
```

### Container Not Starting

If the container fails to start, check for errors in the logs:

```bash
docker logs cro-frontend-app
```

### Application Not Accessible

Make sure the port mapping is correct and not conflicting with other services:

```bash
# Check running containers and port mappings
docker ps
```

## Production Considerations

For production deployments, consider:

1. Using a reverse proxy (like Nginx or Traefik) for SSL termination
2. Setting up proper health checks
3. Implementing a CI/CD pipeline for automated deployments
4. Using Docker volumes for persistent data if needed
5. Configuring proper resource limits for containers

## Support

If you encounter any issues with the Docker deployment, please contact the DevOps team.