# Read Commands

All examples use `--json` for jq piping. Flag position doesn't matter.

## Boards

| Command | Args | Purpose |
|---------|------|---------|
| `--get-boards` | | All your boards |
| `--get-board` | `BOARD_ID` | Single board detail |

```bash
trellocli --json --get-boards | jq '.data[] | {id, name}'
trellocli --json --get-board BOARD_ID | jq '.data | {id, name, desc, url}'
```

## Lists

| Command | Args | Purpose |
|---------|------|---------|
| `--get-lists` | `BOARD_ID` | Lists in a board |

```bash
trellocli --json --get-lists BOARD_ID | jq '.data[] | {id, name}'
trellocli --json --get-lists BOARD_ID | jq -r '.data[] | select(.name == "Done") | .id'
```

## Cards

| Command | Args | Purpose |
|---------|------|---------|
| `--get-cards` | `LIST_ID` | Cards in one list |
| `--get-all-cards` | `BOARD_ID` | All cards in board (preferred) |
| `--get-my-cards` | | Your cards across all boards |
| `--get-card` | `CARD_ID` | Single card full detail |
| `--get-card-history` | `CARD_ID [--limit N]` | Card action history |

```bash
trellocli --json --get-cards LIST_ID | jq '.data[] | {id, name, due}'
trellocli --json --get-all-cards BOARD_ID | jq '.data[] | {id, name, due, idList, labels: [.labels[]?.name]}'
trellocli --json --get-card CARD_ID | jq '.data | {id, name, desc, due, idList, url}'
trellocli --json --get-my-cards | jq '.data[] | {id, name, idBoard}'
trellocli --json --get-card-history CARD_ID --limit 5 | jq '.data[] | {type, date}'
```

## Comments

| Command | Args | Purpose |
|---------|------|---------|
| `--get-comments` | `CARD_ID` | Comments on a card |

```bash
trellocli --json --get-comments CARD_ID | jq '.data[] | {id, text: .data.text, by: .memberCreator.fullName, date}'
```

## Attachments

| Command | Args | Purpose |
|---------|------|---------|
| `--list-attachments` | `CARD_ID` | Attachments on a card |

```bash
trellocli --json --list-attachments CARD_ID | jq '.data[] | {id, name, url}'
```

Note: Downloading attachments not supported (requires browser auth).

## Labels, Members, Workspaces

| Command | Args | Purpose |
|---------|------|---------|
| `--get-board-labels` | `BOARD_ID` | Labels on a board |
| `--get-board-members` | `BOARD_ID` | Board members |
| `--get-workspaces` | | Your workspaces |
| `--get-workspace-boards` | `WORKSPACE_ID` | Boards in workspace |

```bash
trellocli --json --get-board-labels BOARD_ID | jq '.data[] | {id, name, color}'
trellocli --json --get-board-members BOARD_ID | jq '.data[] | {id, username, fullName}'
trellocli --json --get-workspaces | jq '.data[] | {id, name}'
trellocli --json --get-workspace-boards WS_ID | jq '.data[] | {id, name}'
```

## Checklists & Activity

| Command | Args | Purpose |
|---------|------|---------|
| `--get-checklists` | `CARD_ID` | Checklists on a card |
| `--get-board-activity` | `BOARD_ID [--limit N]` | Recent board activity |
| `--check-auth` | | Verify credentials |

```bash
trellocli --json --get-checklists CARD_ID | jq '.data[] | {id, name, items: [.checkItems[] | {name, state}]}'
trellocli --json --get-board-activity BOARD_ID --limit 10 | jq '.data[] | {type, date, by: .memberCreator.fullName}'
trellocli --json --check-auth | jq '.data | {username, fullName}'
```
