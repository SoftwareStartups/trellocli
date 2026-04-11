# Source Code

## Module Guide

- **index.ts** — CLI entry point (arg parsing, global flags, command dispatch)

### auth/

OS keychain credential storage via Bun Secrets API: `login` stores API key + token, `logout` removes them. Env vars `TRELLO_API_KEY`/`TRELLO_TOKEN` override stored credentials.

### commands/

**registry.ts** — Declarative command registry using noun-verb subcommand pattern. Commands are defined as data (name, args, handler) and registered in bulk. Subcommands: `boards list`, `boards get`, `cards create`, `cards move`, etc.

### services/

- **configService.ts** — Auth config resolution: env vars → OS keychain. Config at `~/.config/trellocli/`.
- **trelloApiService.ts** — Trello REST API client (boards, lists, cards, labels, members)
- **cacheService.ts** — In-memory response caching to reduce API calls within a session

### models/

- **types.ts** — Domain types: `Board`, `Card`, `TrelloList`, `Label`, `Member`, etc.
- **apiResponse.ts** — `ApiResponse<T>` wrapper with `success()`/`fail()` constructors. Envelope: `{"ok":true,"data":...}` or `{"ok":false,"error":"...","code":"..."}`

### utils/

- **outputFormatter.ts** — JSON/text output switcher (compact JSON, null-stripped)
- **textFormatter.ts** — Human-readable text formatting for boards, cards, lists
- **httpClient.ts** — HTTP client wrapping global `fetch` with auth header injection
- **paramValidation.ts** — Trello-specific validation (24-char hex IDs, dates, label colors, URLs)
- **errorUtils.ts** — Error message extraction from unknown error types
- **logger.ts** — Verbose/debug logging (enabled via `TRELLO_DEBUG=1`)

## Key Patterns

- **Declarative command registry** — Commands defined as config objects in `registry.ts`, not as individual files. Single source of truth for all CLI commands.
- **ApiResponse<T> everywhere** — All service methods return `ApiResponse<T>`. Callers check `.ok` before accessing `.data`.
- **Zero runtime dependencies** — All HTTP, auth, caching, and formatting implemented from scratch using Bun built-ins
- **Auth resolution chain** — CLI flag → env var → OS keychain (configService handles precedence)
- **Response caching** — `cacheService` deduplicates repeated API calls (e.g., fetching the same board for multiple card operations)
