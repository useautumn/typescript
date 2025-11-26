# Developing guide

## Running locally

```sh
npm i
npm run dev
```

## Testing

```sh
npm run clean
npm ci
npm run build
npm run typecheck
npm run test
npm run lint
```

## Deploying

### Building a one-off package

```sh
npm run clean
npm run build
npm pack
```

### Deploying a new version

```sh
# this will change the version and commit it (if you run it in the root directory)
npm version patch
npm publish --dry-run
# sanity check files being included
npm publish
git push --tags
```

#### Alpha release

The same as above, but it requires extra flags so the release is only installed with `@alpha`:

```sh
npm version prerelease --preid alpha
npm publish --tag alpha
```
