# Developing guide

## Running locally

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Testing

```sh
pnpm clean
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## Building a package

```sh
pnpm clean
pnpm build
pnpm pack
```

Inspect the tarball before publishing.

## Publishing a release

Set the deliberate release version in `package.json` and add its changelog entry
before running the release checks. The release script publishes that manifest
version without changing it:

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm publish --dry-run
./publish.sh
```

For a beta release, set the intended prerelease version in `package.json`, then
publish it under the beta tag:

```sh
./publish.sh --tag beta
```
