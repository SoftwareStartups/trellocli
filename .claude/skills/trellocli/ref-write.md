# Write Commands

Response: `{"ok":true,"data":{...}}`. Check `.ok` after each command. Dates: `YYYY-MM-DD`.

## Auth

```bash
trellocli --set-auth API_KEY TOKEN
trellocli --clear-auth
```

## Boards & Lists

```bash
trellocli --create-board "Name" [--desc "..."] [--workspace WS_ID]
trellocli --create-list BOARD_ID "Name"
trellocli --archive-list LIST_ID
```

## Cards

```bash
# Create
trellocli --create-card LIST_ID "Name" [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]

# Update (combine any flags)
trellocli --update-card CARD_ID [--name "..."] [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"] [--labels "id1,id2"] [--members "id1,id2"] [--due-complete]

# Clear a field
trellocli --update-card CARD_ID --due ""

# Move / Copy / Archive / Delete
trellocli --move-card CARD_ID TARGET_LIST_ID
trellocli --copy-card CARD_ID TARGET_LIST_ID [--keep "all"]
trellocli --archive-card CARD_ID
trellocli --delete-card CARD_ID
```

## Comments

```bash
trellocli --add-comment CARD_ID "Text"
trellocli --update-comment CARD_ID COMMENT_ID "New text"
trellocli --delete-comment CARD_ID COMMENT_ID
```

## Attachments

```bash
trellocli --upload-attachment CARD_ID /path/to/file [--name "Display Name"]
trellocli --attach-url CARD_ID "https://..." [--name "Display Name"]
trellocli --delete-attachment CARD_ID ATTACHMENT_ID
```

## Labels

```bash
trellocli --create-label BOARD_ID "Name" COLOR
trellocli --update-label LABEL_ID [--name "..."] [--color COLOR]
trellocli --delete-label LABEL_ID
```

## Members

```bash
trellocli --assign-member CARD_ID MEMBER_ID
trellocli --remove-member CARD_ID MEMBER_ID
```

## Checklists

```bash
trellocli --create-checklist CARD_ID "Name"
trellocli --add-checklist-item CHECKLIST_ID "Item text"
trellocli --update-checklist-item CARD_ID ITEM_ID [--name "..."] [--state complete|incomplete]
trellocli --delete-checklist CHECKLIST_ID
```
