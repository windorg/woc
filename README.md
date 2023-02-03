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

You should also run the GraphQL codegen watcher, at least until https://github.com/capaj/graphql-codegen-vscode/issues/21 is fixed:

```
npm run gql:watch
```

## Local development - Tauri

```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

Building the prod app:

```bash
# This is not necessary right now because we're building the app simply as a wrapper.
# rm .env
# ODE_ENV=production npm run build
# DATABASE_URL="postgresql://user:password@localhost:3999/db_dev" NODE_ENV=production npx next export

npx tauri build --debug                # --debug for the web inspector to work
```

Upgrading Tauri:

```bash
npm i -S -D @tauri-apps/cli@latest

cd src-tauri
cargo install cargo-edit  # provides cargo upgrade, needed only once
cargo upgrade
```

Generating icons:

```bash
npm run tauri icon public/icon-macos.png
```

## Running tests locally

```
npx playwright install  # install browsers; only needed once
```

To run:

```
dotenv -e .env.development -- npx playwright test --workers=1
```

The server must be running for the tests to work. `--workers=1` runs tests without parallelism — this is necessary because otherwise hot reloading messes things up.

## Upgrading Tiptap

```bash
cd tiptap
git fetch --all
git rebase upstream/main

# Kill the commit that adds @ts-nocheck
git reset HEAD^ --hard

# Add @ts-nocheck
(cd ..; npm run tiptap-nocheck)

# Commit and update the submodule
git add .
git commit -m "Add @ts-nocheck"
git push origin HEAD:main --force
cd ..
git submodule update --remote tiptap
```
