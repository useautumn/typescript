# ATMN CLI - Code Conventions

## Directory Structure

The CLI has two source directories:

- **`source/`** - Legacy code (commands, core logic, compose builders)
- **`src/`** - New code following improved architecture

New features should be added to `src/`. Existing features in `source/` will be migrated incrementally.

```
atmn/
├── source/                    # Legacy code
│   ├── cli.ts                 # Main entry point
│   ├── constants.ts           # BACKEND_URL, FRONTEND_URL, DEFAULT_CONFIG
│   ├── index.ts               # Package exports
│   ├── commands/              # CLI commands (pull, push, nuke, init)
│   ├── core/                  # Business logic, API requests, utilities
│   └── compose/               # DSL builders for plans/features
│
├── src/                       # New architecture
│   ├── commands/              # Command modules (each command in its own folder)
│   │   └── auth/              # Auth command
│   │       ├── command.ts     # Main command export
│   │       ├── oauth.ts       # OAuth flow logic
│   │       └── constants.ts   # Command-specific constants
│   └── views/                 # UI templates
│       └── html/              # HTML templates for browser callbacks
│           └── oauth-callback.ts
│
├── test/                      # Tests
└── dist/                      # Build output
```

## Architecture Conventions

### Commands (`src/commands/<name>/`)

Each command should have its own folder with:
- `command.ts` - The main command function (default export)
- `constants.ts` - Command-specific constants
- Additional files for supporting logic (e.g., `oauth.ts` for auth)

### Views (`src/views/`)

UI templates organized by type:
- `html/` - HTML templates (for browser callbacks, etc.)
- `react/` - React/Ink components (future)

### Shared Utilities

Currently in `source/core/utils.ts`. These will be migrated to `src/utils/` as needed:
- `env.ts` - Environment variable helpers (`readFromEnv`, `storeToEnv`)
- `spinner.ts` - CLI spinner (`initSpinner`)
- `string.ts` - String utilities

## Import Conventions

- Use `.js` extensions in imports (required for ESM)
- Import shared constants from `source/constants.js` (until migrated)
- Import utilities from `source/core/utils.js` (until migrated)

## OAuth Flow

The auth command uses OAuth 2.1 PKCE:
1. Local HTTP server starts on port `31448` (or next available up to `31452`)
2. Browser opens to backend authorize URL with PKCE challenge
3. User authenticates and selects organization
4. Callback received with authorization code
5. Code exchanged for access token
6. Access token used to create API keys via `/cli/api-keys` endpoint
7. Keys saved to `.env` file

Key constants:
- `CLI_CLIENT_ID`: `qncNuaPFAEBwzCypjFopNCGPHQDqkchp`
- `OAUTH_PORTS`: `31448-31452` (5 ports, tries each in sequence if previous is in use)

## Build

```bash
npm run build    # Build with tsup
npm run dev      # Watch mode
npm run test     # Run tests
```

Entry points are in `source/` but tsup follows imports to include `src/` files.
