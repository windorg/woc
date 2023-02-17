# Prisma

## Workflow for adding a new field

Add the field to local DB:

```
dotenv -e .env.development -- npx prisma db push
```

After you're happy, create a migration:

```
dotenv -e .env.development -- npx prisma migrate dev
```

For whatever reason Prisma complains about tons of missing indices etc. Okay.

Run the migration on live DB:

```
# The string can be taken from the DigitalOcean dashboard
DATABASE_URL=... npx prisma migrate deploy
```