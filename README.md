# WOC

## Local development

Install Docker, if you don't have it yet.

Then:

```
git submodule update --init --recursive   # pull submodules
volta install dotenv-cli                  # install dotenv
brew install postgres                     # install psql
docker-compose up -d                      # run services
ln -s .env.development .env               # for convenience

# Initialize the DB if it's empty
dotenv -- psql -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
npx prisma db push
```

## Running tests locally

```
npx playwright install  # install browsers; only needed once
```

To run:

```
dotenv -- npx playwright test --workers=1
```

The server must be running for the tests to work. `--workers=1` runs tests without parallelism — this is necessary because otherwise hot reloading messes things up.
