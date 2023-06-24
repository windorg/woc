# WOC

## Doc links

* [Feature status](docs/feature-status.md)

## Local development setup

Install Docker, if you don't have it yet.

Then:

```bash
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

```bash
npm run gql:watch
```

## Local development - running the app

Check that the services are running:

```bash
docker compose ps
```

Then:

```bash
npm run dev
```

## Local development - Tauri

Setting up:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

rustup target add x86_64-apple-darwin aarch64-apple-darwin
```

Running in dev mode:

```bash
npm run dev
npm run tauri dev
```


Building the prod app:

```bash
# This is not necessary right now because we're building the app simply as a wrapper.
# rm .env
# NODE_ENV=production npm run build
# DATABASE_URL="postgresql://user:password@localhost:3999/db_dev" NODE_ENV=production npx next export

npx tauri build --debug                # --debug for the web inspector to work
```

Building a universal macOS binary:

```bash
npx tauri build --target universal-apple-darwin
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

```bash
npx playwright install  # install browsers; only needed once
```

To run:

```bash
dotenv -e .env.development -- npx playwright test --workers=1
```

The server must be running for the tests to work. `--workers=1` runs tests without parallelism — this is necessary because otherwise hot reloading messes things up.

Tests use the following users:

  * `alice@woc.test`, password `test`
  * `bob@woc.test`, password `test`

As of Jun 2023, the tests are flaky. You might be getting `waiting for locator('text=Account') to be visible` and then you try again several times and suddenly it works.

## Connecting to local database

```bash
dotenv -e .env.development -- npx prisma studio
```

## Upgrading dependencies

List outdated:

```bash
npm outdated
```

Do an interactive upgrade:

```bash
npx npm-upgrade
```

Read changelogs for major version upgrades — some things are not going to be caught by TypeScript, eg. the `command -> meta` change in react-hotkeys-hook.

Don't upgrade ProseMirror stuff or @types/node.

Run `npm i`. Run `npm run check`.

## Upgrading Tiptap

```bash
cd tiptap
git fetch --all
```

Note the commits in our fork:

```bash
git log --oneline
```

Kill our commits with `git reset ... --hard`. (For example, smth like the unused-packages commit is hard to rebase. The `@ts-nocheck` commit has to be repeated every time anyway.)

Get upstream changes:

```bash
git rebase upstream/main
```

Copy all dependencies from `tiptap/packages/pm/package.json` into our `package.json`, and run `npm i`.

```bash
# Add @ts-nocheck
(cd ..; npm run tiptap-nocheck)
git add .
git commit -m "WOC: Add @ts-nocheck"
```

`git cherry-pick` our commits back.

Check that things build: `npm run build`. Do `npm run dev` and check that the editor works.

NOTE: `rm -rf tiptap/node_modules` if you get weird errors.

```bash
# Commit and update the submodule

git push origin HEAD:main --force
(cd ..; git submodule update --remote tiptap)
```
