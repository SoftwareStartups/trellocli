# Trello CLI

A Bun-native TypeScript CLI for Trello integration with Claude Code. Manage your Trello boards, lists, and cards using natural language through Claude Code.

> **Attribution:** Based on [trello-cli-ts](https://github.com/marcosferr/trello-cli-ts) by Marcos Ferreira, itself a TypeScript port of [ZenoxZX/trello-cli](https://github.com/ZenoxZX/trello-cli) (.NET). Now maintained by [SoftwareStartups](https://github.com/SoftwareStartups).

## What is it?

`trello-cli` is a command-line tool that communicates with the Trello API. It can be used standalone or through Claude Code to:

- Manage boards, lists, and cards
- Track tasks with due dates, labels, and checklists
- Handle comments, attachments, and members
- Organize work across workspaces

## Installation

### From GitHub Releases (recommended)

Download a pre-compiled binary for your platform from [GitHub Releases](https://github.com/SoftwareStartups/trellocli/releases):

```bash
# macOS (Apple Silicon)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trello-cli-darwin-arm64 -o trello-cli
chmod +x trello-cli
sudo mv trello-cli /usr/local/bin/

# macOS (Intel)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trello-cli-darwin-x64 -o trello-cli
chmod +x trello-cli
sudo mv trello-cli /usr/local/bin/

# Linux (x64)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trello-cli-linux-x64 -o trello-cli
chmod +x trello-cli
sudo mv trello-cli /usr/local/bin/

# Linux (ARM64)
curl -L https://github.com/SoftwareStartups/trellocli/releases/latest/download/trello-cli-linux-arm64 -o trello-cli
chmod +x trello-cli
sudo mv trello-cli /usr/local/bin/
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
trello-cli --set-auth <api-key> <token>
trello-cli --check-auth
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

This repo includes a Claude Code skill (`.claude/skills/trello-cli/`) that teaches Claude which commands to run. To install:

```bash
cp -r .claude/skills/trello-cli ~/.claude/skills/
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
trello-cli --set-auth <api-key> <token>
trello-cli --check-auth
trello-cli --clear-auth
```

### Boards

```bash
trello-cli --get-boards
trello-cli --get-board <board-id>
trello-cli --create-board "<name>" [--desc "<desc>"] [--workspace <workspace-id>]
trello-cli --get-board-activity <board-id> [--limit <n>]
```

### Lists

```bash
trello-cli --get-lists <board-id>
trello-cli --create-list <board-id> "<name>"
trello-cli --archive-list <list-id>
```

### Cards

```bash
trello-cli --get-cards <list-id>
trello-cli --get-all-cards <board-id>
trello-cli --get-my-cards
trello-cli --get-card <card-id>
trello-cli --get-card-history <card-id> [--limit <n>]
trello-cli --create-card <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]
trello-cli --update-card <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"] [--start "<date>"] [--labels "<ids>"] [--members "<ids>"] [--due-complete]
trello-cli --move-card <card-id> <target-list-id>
trello-cli --copy-card <card-id> <target-list-id> [--keep "<what>"]
trello-cli --archive-card <card-id>
trello-cli --delete-card <card-id>
```

### Comments

```bash
trello-cli --get-comments <card-id>
trello-cli --add-comment <card-id> "<text>"
trello-cli --update-comment <card-id> <comment-id> "<text>"
trello-cli --delete-comment <card-id> <comment-id>
```

### Attachments

```bash
trello-cli --list-attachments <card-id>
trello-cli --upload-attachment <card-id> <file-path> [--name "<name>"]
trello-cli --attach-url <card-id> <url> [--name "<name>"]
trello-cli --delete-attachment <card-id> <attachment-id>
```

> **Note:** Downloading attachments is not supported — Trello's download API requires browser authentication. Use `--attach-url` to link attachments.

### Labels

```bash
trello-cli --get-board-labels <board-id>
trello-cli --create-label <board-id> "<name>" <color>
trello-cli --update-label <label-id> [--name "<name>"] [--color <color>]
trello-cli --delete-label <label-id>
```

### Members

```bash
trello-cli --get-board-members <board-id>
trello-cli --assign-member <card-id> <member-id>
trello-cli --remove-member <card-id> <member-id>
```

### Workspaces

```bash
trello-cli --get-workspaces
trello-cli --get-workspace-boards <workspace-id>
```

### Checklists

```bash
trello-cli --get-checklists <card-id>
trello-cli --create-checklist <card-id> "<name>"
trello-cli --add-checklist-item <checklist-id> "<name>"
trello-cli --update-checklist-item <card-id> <check-item-id> [--name "<name>"] [--state "complete|incomplete"]
trello-cli --delete-checklist <checklist-id>
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
