---
name: trellocli
description: Trello board, list and card management via CLI. Activate when user mentions "Trello" - examples: "Show my Trello tasks", "Add card to Trello", "Move on Trello", "Trello board", "List Trello", "Trello cards".
---

# Trellocli

## Rules

1. Only activate when "Trello" is mentioned
2. Always use `--json` and pipe through `jq` to keep context small
3. Check `.ok` in output — `true` = success, `false` = error
4. Resolve IDs progressively: board → list → card
5. Use `--no-cache` when data seems stale

## Output

```json
{"ok":true,"data":[...]}
{"ok":false,"error":"...","code":"..."}
```

## Primary Workflow: Cards in a Column

```bash
# 1. Find board
trellocli --json boards list | jq '.data[] | {id, name}'

# 2. Find list by name
trellocli --json lists get BOARD_ID | jq -r '.data[] | select(.name == "To Do") | .id'

# 3. Cards in that list
trellocli --json cards list LIST_ID | jq '.data[] | {id, name, due}'
```

## Common Patterns

```bash
# All cards on a board with labels
trellocli --json cards list-all BOARD_ID | jq '.data[] | {id, name, due, idList, labels: [.labels[]?.name]}'

# My cards across all boards
trellocli --json cards mine | jq '.data[] | {id, name, idBoard}'

# Extract a single ID (for scripting)
trellocli --json lists get BOARD_ID | jq -r '.data[] | select(.name == "Done") | .id'

# Check auth
trellocli --json auth status | jq '.ok'
```

Error codes: `AUTH_ERROR` `NOT_FOUND` `MISSING_PARAM` `HTTP_ERROR` `ERROR`

## References

- **Read commands + jq:** [ref-read.md](ref-read.md)
- **Write commands:** [ref-write.md](ref-write.md)
- **Full help:** `trellocli --help`
