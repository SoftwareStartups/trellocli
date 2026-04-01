# Trello CLI

A Bun-native TypeScript CLI for Trello integration with Claude Code. Manage your Trello boards, lists, and cards using natural language through Claude Code.

> **Attribution:** This project is based on [trello-cli-ts](https://github.com/marcosferr/trello-cli-ts) by Marcos Ferreira, itself a TypeScript port of [ZenoxZX/trello-cli](https://github.com/ZenoxZX/trello-cli) (.NET). Now maintained by [SoftwareStartups](https://github.com/SoftwareStartups).

## What is it?

`trello-cli` is a command-line tool that communicates with the Trello API. Claude Code uses this tool to:

- List your boards
- View, create, and update your cards
- Move cards between lists
- Track your tasks
- Manage attachments and comments

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

## Claude Code Skills

This repo includes a Claude Code Skill that teaches Claude how to use this CLI effectively. When you mention "Trello", Claude automatically loads the skill and knows which commands to run.

### Installing the Skill

```bash
cp -r .claude/skills/trello-cli ~/.claude/skills/
```

## Command Summary

```bash
# Authentication
trello-cli --set-auth <api-key> <token>
trello-cli --check-auth
trello-cli --clear-auth

# Board operations
trello-cli --get-boards
trello-cli --get-board <board-id>

# List operations
trello-cli --get-lists <board-id>
trello-cli --create-list <board-id> "<name>"

# Card operations
trello-cli --get-cards <list-id>
trello-cli --get-all-cards <board-id>
trello-cli --get-card <card-id>
trello-cli --create-card <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"]
trello-cli --update-card <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"]
trello-cli --move-card <card-id> <target-list-id>
trello-cli --delete-card <card-id>

# Comment operations
trello-cli --get-comments <card-id>
trello-cli --add-comment <card-id> "<text>"

# Attachment operations
trello-cli --list-attachments <card-id>
trello-cli --upload-attachment <card-id> <file-path> [--name "<name>"]
trello-cli --attach-url <card-id> <url> [--name "<name>"]
trello-cli --delete-attachment <card-id> <attachment-id>
```

> **Note:** Downloading attachments is not supported — Trello's download API requires browser authentication. Use `--attach-url` to link attachments.

## Development

```bash
bun install                    # Install dependencies
task build                     # Compile TypeScript
task check                     # Lint + typecheck
task format                    # Format with Biome
task ci                        # Full CI pipeline locally
task compile                   # Build standalone binary
```

## Project Structure

```
trellocli/
├── src/                       # TypeScript source code
│   ├── index.ts               # CLI entry point
│   ├── commands/              # Command handlers
│   ├── services/              # API and config services
│   ├── models/                # Type definitions
│   └── utils/                 # Output formatting
├── build/                     # Compiled JavaScript (generated)
├── dist/                      # Standalone binaries (generated)
├── .claude/skills/            # Claude Code skill definition
├── .github/workflows/         # CI and release workflows
├── docs/                      # Documentation
├── Taskfile.yml               # Task runner config
├── biome.json                 # Linter/formatter config
├── package.json
└── tsconfig.json
```

## License

This project is licensed under the [MIT License](LICENSE).
