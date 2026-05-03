# Write Commands

Response: `{"ok":true,"data":{...}}`. Check `.ok` after each command. Dates: `YYYY-MM-DD`.

## Auth

```bash
trellocli login [--api-key KEY --token TOKEN] [--skip-validation]
trellocli logout
```

## Boards & Lists

```bash
trellocli boards create "Name" [--desc "..."] [--workspace WS_ID]
trellocli lists create BOARD_ID "Name"
trellocli lists archive LIST_ID
```

## Cards

```bash
# Create
trellocli cards create LIST_ID "Name" [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]

# Update (combine any flags)
trellocli cards update CARD_ID [--name "..."] [--desc "..."] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"] [--labels "id1,id2"] [--members "id1,id2"] [--due-complete]

# Clear a field
trellocli cards update CARD_ID --due ""

# Move / Copy / Archive / Delete
trellocli cards move CARD_ID TARGET_LIST_ID
trellocli cards copy CARD_ID TARGET_LIST_ID [--keep "all"]
trellocli cards archive CARD_ID
trellocli cards delete CARD_ID
```

## Comments

```bash
trellocli comments add CARD_ID "Text"
trellocli comments update CARD_ID COMMENT_ID "New text"
trellocli comments delete CARD_ID COMMENT_ID
```

## Attachments

```bash
trellocli attachments upload CARD_ID /path/to/file [--name "Display Name"]
trellocli attachments attach-url CARD_ID "https://..." [--name "Display Name"]
trellocli attachments delete CARD_ID ATTACHMENT_ID
```

## Labels

```bash
trellocli labels create BOARD_ID "Name" COLOR
trellocli labels update LABEL_ID [--name "..."] [--color COLOR]
trellocli labels delete LABEL_ID
```

## Members

```bash
trellocli members assign CARD_ID MEMBER_ID
trellocli members remove CARD_ID MEMBER_ID
```

## Checklists

```bash
trellocli checklists create CARD_ID "Name"
trellocli checklists add-item CHECKLIST_ID "Item text"
trellocli checklists update-item CARD_ID ITEM_ID [--name "..."] [--state complete|incomplete]
trellocli checklists delete CHECKLIST_ID
```
