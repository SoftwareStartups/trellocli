# Trellocli

A Bun-native TypeScript CLI for Trello integration with Claude Code. Manage your Trello boards, lists, and cards using natural language through Claude Code.

> **Attribution:** Based on [trellocli-ts](https://github.com/marcosferr/trellocli-ts) by Marcos Ferreira, itself a TypeScript port of [ZenoxZX/trellocli](https://github.com/ZenoxZX/trellocli) (.NET). Now maintained by [SoftwareStartups](https://github.com/SoftwareStartups).

## What is it?

`trellocli` is a command-line tool that communicates with the Trello API. It can be used standalone or through Claude Code to:

- Manage boards, lists, and cards
- Track tasks with due dates, labels, and checklists
- Handle comments, attachments, and members
- Organize work across workspaces

## Installation

### From GitHub Releases (recommended)

Download a pre-compiled binary for your platform from [GitHub Releases](https://github.com/SoftwareStartups/trellocli/releases):

```bash
# macOS (Apple Silicon)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trellocli-darwin-arm64 -o trellocli
chmod +x trellocli
sudo mv trellocli /usr/local/bin/

# macOS (Intel)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trellocli-darwin-x64 -o trellocli
chmod +x trellocli
sudo mv trellocli /usr/local/bin/

# Linux (x64)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trellocli-linux-x64 -o trellocli
chmod +x trellocli
sudo mv trellocli /usr/local/bin/

# Linux (ARM64)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trellocli-linux-arm64 -o trellocli
chmod +x trellocli
sudo mv trellocli /usr/local/bin/
```

### From Source

Prerequisites: [Bun](https://bun.sh) and [Task](https://taskfile.dev)

```bash
git clone https://github.com/SoftwareStartups/trellocli.git
cd trellocli
bun install
task build
bun link
```

### Setting Up Trello API Credentials

1. Get your **API Key** from https://trello.com/power-ups/admin (or https://trello.com/app-key)
2. Generate a **Token** by visiting:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=TrelloCLI&key=YOUR_API_KEY
   ```
3. Configure the CLI:

```bash
trellocli --set-auth <api-key> <token>
trellocli --check-auth
```

> **Important:** The Token is different from the Secret. The Secret is for OAuth apps — you need the Token for direct API access.

## Usage with Claude Code

Simply mention "Trello" when talking to Claude Code:

```
"Show my Trello tasks"
"Add a new card to Trello: Login page design"
"Move this card to Done on Trello"
"List my Trello boards"
```

This repo includes a Claude Code skill (`.claude/skills/trellocli/`) that teaches Claude which commands to run. To install:

```bash
cp -r .claude/skills/trellocli ~/.claude/skills/
```

## Command Reference

### Global Flags

```bash
--help, -h                           Show help
--version, -v                        Show version
--json                               Output as JSON (default is human-readable text)
--no-cache                           Bypass response cache
--verbose, --debug                   Show HTTP request details on stderr
```

### Authentication

```bash
trellocli --set-auth <api-key> <token>
trellocli --check-auth
trellocli --clear-auth
```

### Boards

```bash
trellocli --get-boards
trellocli --get-board <board-id>
trellocli --create-board "<name>" [--desc "<desc>"] [--workspace <workspace-id>]
trellocli --get-board-activity <board-id> [--limit <n>]
```

### Lists

```bash
trellocli --get-lists <board-id>
trellocli --create-list <board-id> "<name>"
trellocli --archive-list <list-id>
```

### Cards

```bash
trellocli --get-cards <list-id>
trellocli --get-all-cards <board-id>
trellocli --get-my-cards
trellocli --get-card <card-id>
trellocli --get-card-history <card-id> [--limit <n>]
trellocli --create-card <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]
trellocli --update-card <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"] [--start "<date>"] [--labels "<ids>"] [--members "<ids>"] [--due-complete]
trellocli --move-card <card-id> <target-list-id>
trellocli --copy-card <card-id> <target-list-id> [--keep "<what>"]
trellocli --archive-card <card-id>
trellocli --delete-card <card-id>
```

### Comments

```bash
trellocli --get-comments <card-id>
trellocli --add-comment <card-id> "<text>"
trellocli --update-comment <card-id> <comment-id> "<text>"
trellocli --delete-comment <card-id> <comment-id>
```

### Attachments

```bash
trellocli --list-attachments <card-id>
trellocli --upload-attachment <card-id> <file-path> [--name "<name>"]
trellocli --attach-url <card-id> <url> [--name "<name>"]
trellocli --delete-attachment <card-id> <attachment-id>
```

> **Note:** Downloading attachments is not supported — Trello's download API requires browser authentication. Use `--attach-url` to link attachments.

### Labels

```bash
trellocli --get-board-labels <board-id>
trellocli --create-label <board-id> "<name>" <color>
trellocli --update-label <label-id> [--name "<name>"] [--color <color>]
trellocli --delete-label <label-id>
```

### Members

```bash
trellocli --get-board-members <board-id>
trellocli --assign-member <card-id> <member-id>
trellocli --remove-member <card-id> <member-id>
```

### Workspaces

```bash
trellocli --get-workspaces
trellocli --get-workspace-boards <workspace-id>
```

### Checklists

```bash
trellocli --get-checklists <card-id>
trellocli --create-checklist <card-id> "<name>"
trellocli --add-checklist-item <checklist-id> "<name>"
trellocli --update-checklist-item <card-id> <check-item-id> [--name "<name>"] [--state "complete|incomplete"]
trellocli --delete-checklist <checklist-id>
```

## Development

```bash
bun install                    # Install dependencies
task build                     # Compile TypeScript
task test                      # Run tests
task check                     # Lint + typecheck + tests
task format                    # Format with Biome
task ci                        # Full CI pipeline locally
task compile                   # Build standalone binary
```

## Project Structure

```
trellocli/
├── src/                       # TypeScript source code
│   ├── index.ts               # CLI entry point
│   ├── commands/registry.ts   # Declarative command registry
│   ├── services/              # API, config, and cache services
│   ├── models/                # Type definitions and API response wrapper
│   └── utils/                 # Formatting, validation, HTTP, logging
├── tests/                     # Unit tests (mirrors src/ structure)
├── build/                     # Compiled JavaScript (generated)
├── dist/                      # Standalone binaries (generated)
├── .claude/skills/            # Claude Code skill definition
├── .github/workflows/         # CI and release workflows
├── Taskfile.yml               # Task runner config
├── biome.json                 # Linter/formatter config
├── package.json
└── tsconfig.json
```

## License

This project is licensed under the [MIT License](LICENSE).
