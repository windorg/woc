# WOC

## Local development

Install Docker, if you don't have it yet.

Then:

```
git submodule update --init --recursive   # pull submodules
volta install dotenv-cli                  # install dotenv
brew install postgres                     # install psql
docker-compose up -d                      # run services

# Initialize the DB if it's empty
dotenv -e .env.development -- psql -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
dotenv -e .env.development -- npx prisma db push
```
