# Secrets

## Overview

Most values in `.env.development` and `.env.production` aren't secret. The ones that are secret, live in `*.enc` files encrypted with Sops.

Some features (eg. Beeminder integration) can only be tested in development mode if you have access to secrets. However, the app should remain runnable in development even without secrets.

The primary reason for using Sops is that eg. development secrets don't belong in DigitalOcean, but they should live somewhere instead of being copied between developers' machines. So we use Sops. Secrets that relate to DigitalOcean infrastructure, like database passwords, live in DigitalOcean settings; else is in Sops.

## Setting up sops

Install:

```bash
brew install sops age
```

Create an age key:

```bash
mkdir -p "$HOME/Library/Application Support/sops/age/"
age-keygen -o "$HOME/Library/Application Support/sops/age/keys.txt"
```

## Encrypting

```bash
sops --encrypt --in-place .env.development.enc
sops --encrypt --in-place .env.production.enc
```

## Editing encrypted files

```bash
sops <file name>
```

## Detecting and removing secrets

Secrets can be detected across commits with `gitleaks detect -v`.

Secrets can be removed with `bfg `
