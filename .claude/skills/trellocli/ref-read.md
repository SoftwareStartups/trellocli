# Read Commands

All examples use `--json` for jq piping. Flag position doesn't matter.

## Boards

| Command | Args | Purpose |
|---------|------|---------|
| `boards list` | | All your boards |
| `boards get` | `BOARD_ID` | Single board detail |

```bash
trellocli --json boards list | jq '.data[] | {id, name}'
trellocli --json boards get BOARD_ID | jq '.data | {id, name, desc, url}'
```

## Lists

| Command | Args | Purpose |
|---------|------|---------|
| `lists get` | `BOARD_ID` | Lists in a board |

```bash
trellocli --json lists get BOARD_ID | jq '.data[] | {id, name}'
trellocli --json lists get BOARD_ID | jq -r '.data[] | select(.name == "Done") | .id'
```

## Cards

| Command | Args | Purpose |
|---------|------|---------|
| `cards list` | `LIST_ID` | Cards in one list |
| `cards list-all` | `BOARD_ID` | All cards in board (preferred) |
| `cards mine` | | Your cards across all boards |
| `cards get` | `CARD_ID` | Single card full detail |
| `cards history` | `CARD_ID [--limit N]` | Card action history |

```bash
trellocli --json cards list LIST_ID | jq '.data[] | {id, name, due}'
trellocli --json cards list-all BOARD_ID | jq '.data[] | {id, name, due, idList, labels: [.labels[]?.name]}'
trellocli --json cards get CARD_ID | jq '.data | {id, name, desc, due, idList, url}'
trellocli --json cards mine | jq '.data[] | {id, name, idBoard}'
trellocli --json cards history CARD_ID --limit 5 | jq '.data[] | {type, date}'
```

## Comments

| Command | Args | Purpose |
|---------|------|---------|
| `comments list` | `CARD_ID` | Comments on a card |

```bash
trellocli --json comments list CARD_ID | jq '.data[] | {id, text: .data.text, by: .memberCreator.fullName, date}'
```

## Attachments

| Command | Args | Purpose |
|---------|------|---------|
| `attachments list` | `CARD_ID` | Attachments on a card |

```bash
trellocli --json attachments list CARD_ID | jq '.data[] | {id, name, url}'
```

Note: Downloading attachments not supported (requires browser auth).

## Labels, Members, Workspaces

| Command | Args | Purpose |
|---------|------|---------|
| `labels list` | `BOARD_ID` | Labels on a board |
| `members list` | `BOARD_ID` | Board members |
| `workspaces list` | | Your workspaces |
| `workspaces boards` | `WORKSPACE_ID` | Boards in workspace |

```bash
trellocli --json labels list BOARD_ID | jq '.data[] | {id, name, color}'
trellocli --json members list BOARD_ID | jq '.data[] | {id, username, fullName}'
trellocli --json workspaces list | jq '.data[] | {id, name}'
trellocli --json workspaces boards WS_ID | jq '.data[] | {id, name}'
```

## Checklists & Activity

| Command | Args | Purpose |
|---------|------|---------|
| `checklists list` | `CARD_ID` | Checklists on a card |
| `boards activity` | `BOARD_ID [--limit N]` | Recent board activity |
| `auth check` | | Verify credentials |

```bash
trellocli --json checklists list CARD_ID | jq '.data[] | {id, name, items: [.checkItems[] | {name, state}]}'
trellocli --json boards activity BOARD_ID --limit 10 | jq '.data[] | {type, date, by: .memberCreator.fullName}'
trellocli --json auth check | jq '.data | {username, fullName}'
```
