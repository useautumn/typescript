## Autumn JS Monorepo

This repository contains multiple JavaScript/TypeScript packages for working with the Autumn pricing and billing platform.

### Packages

- **`atmn` (CLI)**: Declare pricing as code and apply changes to your Autumn config via a command-line interface.
- **`@useautumn/convex` (Convex Component)**: Integrate Autumn into your Convex project and use hooks/components from `autumn-js`.
- **`autumn-js` (Main SDK + React + Backend)**:
  - SDK for the Autumn API
  - React hooks and UI components
  - Backend handlers to mount routes on your server framework (Next.js, Express, Fastify, Hono, etc.)

### Install

- **CLI (`atmn`)**

```bash
npm i -g atmn
# or run without global install
npx atmn@latest
```

- **Convex component (`@useautumn/convex`)**

```bash
npm i @useautumn/convex autumn-js
```

- **Main package (`autumn-js`)**

```bash
npm i autumn-js
```

### Documentation

- CLI: [atmn/readme.md](atmn/readme.md)
- Convex component: [convex/README.md](convex/README.md)
- Main package: [package/README.md](package/README.md)
