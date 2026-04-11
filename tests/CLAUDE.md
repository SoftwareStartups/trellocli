# Tests

## Structure

```text
tests/
├── unit/                            # No external dependencies, fast
│   ├── auth/keychain.test.ts        # Credential storage
│   ├── commands/registry.test.ts    # Command registration
│   ├── services/                    # trelloApiService, cacheService
│   ├── models/apiResponse.test.ts   # ApiResponse<T> wrapper
│   └── utils/                       # httpClient, outputFormatter, paramValidation, etc.
└── helpers/
    ├── setup.ts       # Global test env: enables JSON mode, sets __TRELLOCLI_TEST
    ├── mockFetch.ts   # mockFetchResponse(), mockFetchSequence(), mockFetchError(), restoreFetch()
    └── testUtils.ts   # captureOutput(), suppressOutput(), test constants (TEST_ID, TEST_API_KEY)
```

## Running Tests

```bash
task test              # Unit tests
```

## Helpers

- **setup.ts** — Global test environment. Imported as preload; sets `__TRELLOCLI_TEST` env var and enables JSON output mode for deterministic assertions.
- **mockFetch.ts** — Fetch mocking utilities. `mockFetchResponse(data)` for single calls, `mockFetchSequence([...])` for ordered responses, `mockFetchError(msg)` for failures. Always call `restoreFetch()` in cleanup.
- **testUtils.ts** — `captureOutput()` intercepts stdout/stderr for assertion. `suppressOutput()` silences console noise. Test constants: `TEST_ID`, `TEST_API_KEY`, `TEST_TOKEN`.

## Conventions

- Framework: `bun:test` (Jest-compatible `describe`/`it`/`expect`)
- Test files: `*.test.ts` mirroring `src/` structure
- Test behavior and outcomes, not implementation details
- Add a unit test for every bug fix
- Tests are production code: strict types, no `any`, no shortcuts
- Unit tests must not make network calls
- Always restore global state (`restoreFetch()`) in `afterEach`
- Use `mockFetch` helpers instead of manual `globalThis.fetch` assignment
