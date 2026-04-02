# Trellocli

Bun-native TypeScript CLI for Trello board, list, and card management. Zero runtime dependencies.

## Commands

```bash
# Setup
bun install                          # Install dependencies
task build                           # Compile TypeScript to build/
task clean                           # Remove build/ and dist/

# Quality
task lint                            # Lint with Biome
task format                          # Format with Biome (write)
task test                            # Run tests (bun test)
task check                           # Lint + typecheck + tests (parallel)

# Pipelines
task ci                              # Full CI locally: clean -> install -> format:check -> check -> build

# Release
task compile                         # Build standalone binary for current platform
task compile:all                     # Build binaries for all 4 platforms
```

## Architecture

```text
src/
├── index.ts                  # CLI entry point (arg parsing, global flags, command dispatch)
├── commands/
│   └── registry.ts           # Declarative command registry (all 52 commands)
├── services/
│   ├── configService.ts      # Auth config (~/.trellocli/config.json + env vars)
│   ├── trelloApiService.ts   # Trello REST API client
│   └── cacheService.ts       # Response caching
├── models/
│   ├── types.ts              # Domain types (Board, Card, TrelloList, etc.)
│   └── apiResponse.ts        # ApiResponse<T> wrapper with success/fail helpers
└── utils/
    ├── outputFormatter.ts    # JSON/text output (compact, null-stripped)
    ├── textFormatter.ts      # Human-readable text formatting
    ├── httpClient.ts         # HTTP client wrapper
    ├── paramValidation.ts    # Input validation (Trello IDs, dates, colors, paths, URLs)
    ├── errorUtils.ts         # Error message extraction
    └── logger.ts             # Verbose/debug logging
tests/
├── helpers/                  # Test utilities (mockFetch, setup, testUtils)
└── unit/                     # Unit tests mirroring src/ structure
```

## Code Style

- TypeScript strict mode, ES2022 target, NodeNext modules
- Biome for linting/formatting (indent 2, single quotes, semicolons, trailing commas es5)
- Bun runtime
- Default output is human-readable text; `--json` flag switches to compact JSON
- API responses use `ApiResponse<T>`: `{"ok":true,"data":...}` or `{"ok":false,"error":"...","code":"..."}`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `TRELLO_API_KEY` | Trello API key (overrides config file) |
| `TRELLO_TOKEN` | Trello API token (overrides config file) |
| `TRELLO_DEBUG` | Set to `1` for verbose HTTP logging |
