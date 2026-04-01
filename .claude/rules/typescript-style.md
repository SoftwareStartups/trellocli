---
paths:
  - "**/*.ts"
---

- Prefix unused parameters with underscore: `_unusedVar`
- No `any` — use `unknown` + type narrowing
- No default exports — named exports only
- Prefer `interface` over `type` for object shapes
- Export types alongside the functions that consume them
- Run `task check` (lint + format + typecheck) before committing
