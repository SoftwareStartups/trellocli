# Write Commands

Response: `{"ok":true,"data":{...}}`. Check `.ok` after each command. Dates: `YYYY-MM-DD`.

## Auth

```bash
trello-cli --set-auth API_KEY TOKEN
trello-cli --clear-auth
```

## Boards & Lists

```bash
trello-cli --create-board "Name" [--desc "..."] [--workspace WS_ID]
trello-cli --create-list BOARD_ID "Name"
trello-cli --archive-list LIST_ID
```

## Cards

```bash
# Create
trello-cli --create-card LIST_ID "Name" [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]

# Update (combine any flags)
trello-cli --update-card CARD_ID [--name "..."] [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"] [--labels "id1,id2"] [--members "id1,id2"] [--due-complete]

# Clear a field
trello-cli --update-card CARD_ID --due ""

# Move / Copy / Archive / Delete
trello-cli --move-card CARD_ID TARGET_LIST_ID
trello-cli --copy-card CARD_ID TARGET_LIST_ID [--keep "all"]
trello-cli --archive-card CARD_ID
trello-cli --delete-card CARD_ID
```

## Comments

```bash
trello-cli --add-comment CARD_ID "Text"
trello-cli --update-comment CARD_ID COMMENT_ID "New text"
trello-cli --delete-comment CARD_ID COMMENT_ID
```

## Attachments

```bash
trello-cli --upload-attachment CARD_ID /path/to/file [--name "Display Name"]
trello-cli --attach-url CARD_ID "https://..." [--name "Display Name"]
trello-cli --delete-attachment CARD_ID ATTACHMENT_ID
```

## Labels

```bash
trello-cli --create-label BOARD_ID "Name" COLOR
trello-cli --update-label LABEL_ID [--name "..."] [--color COLOR]
trello-cli --delete-label LABEL_ID
```

## Members

```bash
trello-cli --assign-member CARD_ID MEMBER_ID
trello-cli --remove-member CARD_ID MEMBER_ID
```

## Checklists

```bash
trello-cli --create-checklist CARD_ID "Name"
trello-cli --add-checklist-item CHECKLIST_ID "Item text"
trello-cli --update-checklist-item CARD_ID ITEM_ID [--name "..."] [--state complete|incomplete]
trello-cli --delete-checklist CHECKLIST_ID
```
