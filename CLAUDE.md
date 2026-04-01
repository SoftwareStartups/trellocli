# Trello CLI

Bun-native TypeScript CLI for Trello board, list, and card management. Zero runtime dependencies — uses Bun's built-in fetch and Node.js compat layer.

Based on [ZenoxZX/trello-cli](https://github.com/ZenoxZX/trello-cli) (.NET), originally ported to TypeScript/Node.js by [Marcos Ferreira](https://github.com/marcosferr).

## Commands

```bash
# Setup
bun install                          # Install dependencies
task build                           # Compile TypeScript to build/
task clean                           # Remove build/ and dist/

# Quality
task lint                            # Lint with Biome
task format                          # Format with Biome (write)
task check                           # Lint + typecheck (parallel)

# Pipelines
task ci                              # Full CI locally: clean -> install -> format:check -> check -> build

# Release
task compile                         # Build standalone binary for current platform
task compile:all                     # Build binaries for all 4 platforms
```

## Architecture

```text
src/
├── index.ts              # CLI entry point (arg parsing, command dispatch)
├── commands/
│   ├── boardCommands.ts  # Board operations
│   ├── listCommands.ts   # List operations
│   ├── cardCommands.ts   # Card operations (CRUD, comments)
│   └── attachmentCommands.ts  # Attachment operations
├── services/
│   ├── configService.ts      # Auth config (~/.trello-cli/config.json + env vars)
│   └── trelloApiService.ts   # Trello REST API client
├── models/
│   ├── types.ts          # Domain types (Board, Card, TrelloList, etc.)
│   └── apiResponse.ts    # ApiResponse<T> wrapper with success/fail helpers
└── utils/
    └── outputFormatter.ts  # JSON output (compact, null-stripped)
```

## Code Style

- TypeScript strict mode, ES2022 target, NodeNext modules
- Biome for linting/formatting (indent 2, single quotes, semicolons, trailing commas es5)
- Bun runtime
- All CLI output is compact JSON: `{"ok":true,"data":...}` or `{"ok":false,"error":"...","code":"..."}`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `TRELLO_API_KEY` | Trello API key (overrides config file) |
| `TRELLO_TOKEN` | Trello API token (overrides config file) |

Alternatively, use `trello-cli --set-auth <api-key> <token>` to save credentials to `~/.trello-cli/config.json`.
