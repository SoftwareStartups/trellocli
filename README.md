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
trellocli auth set <api-key> <token>
trellocli auth check
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
trellocli auth set <api-key> <token>
trellocli auth check
trellocli auth clear
```

### Boards

```bash
trellocli boards list
trellocli boards get <board-id>
trellocli boards create "<name>" [--desc "<desc>"] [--workspace <workspace-id>]
trellocli boards activity <board-id> [--limit <n>]
```

### Lists

```bash
trellocli lists get <board-id>
trellocli lists create <board-id> "<name>"
trellocli lists archive <list-id>
```

### Cards

```bash
trellocli cards list <list-id>
trellocli cards list-all <board-id>
trellocli cards mine
trellocli cards get <card-id>
trellocli cards history <card-id> [--limit <n>]
trellocli cards create <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]
trellocli cards update <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"] [--start "<date>"] [--labels "<ids>"] [--members "<ids>"] [--due-complete]
trellocli cards move <card-id> <target-list-id>
trellocli cards copy <card-id> <target-list-id> [--keep "<what>"]
trellocli cards archive <card-id>
trellocli cards delete <card-id>
```

### Comments

```bash
trellocli comments list <card-id>
trellocli comments add <card-id> "<text>"
trellocli comments update <card-id> <comment-id> "<text>"
trellocli comments delete <card-id> <comment-id>
```

### Attachments

```bash
trellocli attachments list <card-id>
trellocli attachments upload <card-id> <file-path> [--name "<name>"]
trellocli attachments attach-url <card-id> <url> [--name "<name>"]
trellocli attachments delete <card-id> <attachment-id>
```

> **Note:** Downloading attachments is not supported — Trello's download API requires browser authentication. Use `attachments attach-url` to link attachments.

### Labels

```bash
trellocli labels list <board-id>
trellocli labels create <board-id> "<name>" <color>
trellocli labels update <label-id> [--name "<name>"] [--color <color>]
trellocli labels delete <label-id>
```

### Members

```bash
trellocli members list <board-id>
trellocli members assign <card-id> <member-id>
trellocli members remove <card-id> <member-id>
```

### Workspaces

```bash
trellocli workspaces list
trellocli workspaces boards <workspace-id>
```

### Checklists

```bash
trellocli checklists list <card-id>
trellocli checklists create <card-id> "<name>"
trellocli checklists add-item <checklist-id> "<name>"
trellocli checklists update-item <card-id> <check-item-id> [--name "<name>"] [--state "complete|incomplete"]
trellocli checklists delete <checklist-id>
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
