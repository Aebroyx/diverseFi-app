# diverseFi-api

Go API backend for the DiverseFi application.

## Database

The API connects to PostgreSQL using `DB_NAME` (default: `diversefi_db`).

```bash
# Create the database (if it does not exist yet)
createdb diversefi_db

# Copy env template and set your credentials
cp .env.example .env
```

