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

## Local development - Tauri

```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

Building the prod app:

```
rm .env
DATABASE_URL="postgresql://user:password@localhost:3999/db_dev" NODE_ENV=production npm run build
DATABASE_URL="postgresql://user:password@localhost:3999/db_dev" NODE_ENV=production npx next export
npx tauri build --debug                # --debug for the web inspector to work
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
