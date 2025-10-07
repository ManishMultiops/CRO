# Docker Troubleshooting Guide for CRO Backend

This guide addresses common issues you might encounter when deploying the CRO Backend with Docker.

## Current Issue: PostgreSQL Container Failing to Start

The error you're seeing:
```
Error: Database is uninitialized and superuser password is not specified.
       You must specify POSTGRES_PASSWORD to a non-empty value for the superuser.
```

### Solution Steps

1. **Environment Variable Issue**

   The database container fails because it can't access the required environment variables. This can happen because:
   - Environment variables aren't being properly passed from the .env file
   - The .env file might be missing required variables

2. **Fix Using Direct Environment Variables**

   We've updated the `docker-compose.yml` file to use hardcoded values instead of relying on environment variable substitution. This should allow your containers to start even if the .env file isn't correctly set up.

3. **Try These Commands**

   ```bash
   # Stop all running containers
   docker-compose down
   
   # Remove any existing volumes (WARNING: This deletes existing data)
   docker-compose down -v
   
   # Start the containers with the new configuration
   docker-compose up -d
   ```

4. **If Still Failing**
   
   Try running with logging to see the exact error:
   ```bash
   docker-compose up
   ```
   This will show you the real-time logs from all containers and help identify what's going wrong.

## Other Common Docker Issues

### Web Container Can't Connect to Database

If the web container starts but can't connect to the database:

1. Check both containers are running:
   ```bash
   docker-compose ps
   ```

2. Make sure the database container is healthy:
   ```bash
   docker logs crobackend-db-1
   ```

3. Verify database settings in both containers match:
   ```bash
   # These values should match your docker-compose.yml configuration
   DB_NAME=cro_db
   DB_USER=cro_user
   DB_PASSWORD=postgres
   DB_HOST=db
   DB_PORT=5432
   ```

### Permission Issues with Volumes

If you see permission errors when accessing volumes:

1. Fix permissions on the host:
   ```bash
   # Find volume location (usually in /var/lib/docker/volumes)
   docker volume inspect crobackend_postgres_data
   
   # Then change ownership (requires sudo)
   sudo chown -R 999:999 /path/to/volume
   ```

### Container Exits Immediately

If the web container starts but then exits:

1. Check logs for errors:
   ```bash
   docker logs crobackend-web-1
   ```

2. Run the container in interactive mode:
   ```bash
   docker-compose run --rm web bash
   ```
   
3. Try running commands manually to see where it fails:
   ```bash
   python manage.py check
   ```

## Using Custom .env Files

We've provided a `.env.docker` file with default values. To use it:

```bash
# Copy the example file
cp .env.docker .env

# Start the containers
docker-compose up -d
```

## Best Practices

1. **Always use explicit environment variables in docker-compose.yml**
   
   Even if you're using an .env file, it's good to have defaults in the docker-compose.yml file to prevent startup failures.

2. **Use healthchecks**
   
   We've added healthchecks to the PostgreSQL container so the web container will wait until the database is ready.

3. **Use named volumes**
   
   Always use named volumes instead of anonymous volumes to make data management easier.

4. **Review logs when troubleshooting**
   
   Container logs are your best source of information when debugging Docker issues.