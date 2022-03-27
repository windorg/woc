# WOC

## Local development

Run Postgres:

```
docker-compose up -d

# Initialize the DB if it's empty
dotenv -e .env.development -- psql -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
dotenv -e .env.development -- npx prisma db push
```
