# Database settings override for CRO Backend
# This file will be used to override the database settings in the main settings.py file

import os

# PostgreSQL Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'cro_db'),
        'USER': os.environ.get('DB_USER', 'cro_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,  # Keep connections open for a minute
        'OPTIONS': {
            'connect_timeout': 10,  # 10-second connection timeout
        },
    }
}

# Print database configuration for debugging (will appear in container logs)
print(f"\nDATABASE CONFIGURATION:")
print(f"  NAME: {DATABASES['default']['NAME']}")
print(f"  USER: {DATABASES['default']['USER']}")
print(f"  HOST: {DATABASES['default']['HOST']}")
print(f"  PORT: {DATABASES['default']['PORT']}")
print(f"  ENVIRONMENT VARS: {dict((k, v) for k, v in os.environ.items() if 'DB_' in k or 'DATABASE_' in k)}")
print("")
