#!/usr/bin/env bun

import { ConfigService } from './services/configService.js';
import { TrelloApiService } from './services/trelloApiService.js';
import { BoardCommands } from './commands/boardCommands.js';
import { ListCommands } from './commands/listCommands.js';
import { CardCommands } from './commands/cardCommands.js';
import { AttachmentCommands } from './commands/attachmentCommands.js';
import { success, fail } from './models/apiResponse.js';
import { print } from './utils/outputFormatter.js';

const VERSION = '1.1.0';

function showHelp(): void {
  console.log(`
trello-cli v${VERSION}

Usage: trello-cli <command> [options]

Authentication:
  --set-auth <api-key> <token>   Save Trello credentials
  --clear-auth                   Remove saved credentials
  --check-auth                   Verify authentication

Board Commands:
  --get-boards                   List all boards
  --get-board <board-id>         Get board details

List Commands:
  --get-lists <board-id>         Get lists in a board
  --create-list <board-id> "<name>"  Create a new list

Card Commands:
  --get-cards <list-id>          Get cards in a list
  --get-all-cards <board-id>     Get all cards in a board
  --get-card <card-id>           Get card details
  --create-card <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"]
  --update-card <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"]
  --move-card <card-id> <target-list-id>
  --delete-card <card-id>
  --get-comments <card-id>       Get comments on a card
  --add-comment <card-id> "<text>"  Add a comment

Attachment Commands:
  --list-attachments <card-id>   List attachments on a card
  --upload-attachment <card-id> <file-path> [--name "<name>"]
  --attach-url <card-id> <url> [--name "<name>"]
  --delete-attachment <card-id> <attachment-id>

Options:
  --help, -h                     Show this help
  --version, -v                  Show version
`);
}

function getArg(args: string[], index: number): string {
  return args[index] ?? '';
}

function getNamedArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const config = new ConfigService();

  // Check for help/version first
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    console.log(`trello-cli v${VERSION}`);
    return;
  }

  // Handle auth config commands (no validation needed)
  if (args[0] === '--set-auth') {
    const apiKey = getArg(args, 1);
    const token = getArg(args, 2);

    if (!apiKey || !token) {
      print(
        fail('Usage: trello-cli --set-auth <api-key> <token>', 'MISSING_PARAM')
      );
      return;
    }

    const { success: ok, error } = ConfigService.saveAuth(apiKey, token);
    if (ok) {
      print(success({ message: 'Auth saved to ~/.trello-cli/config.json' }));
    } else {
      print(fail(error ?? 'Unknown error', 'SAVE_ERROR'));
    }
    return;
  }

  if (args[0] === '--clear-auth') {
    const { success: ok, error } = ConfigService.clearAuth();
    if (ok) {
      print(success({ message: 'Auth cleared' }));
    } else {
      print(fail(error ?? 'Unknown error', 'CLEAR_ERROR'));
    }
    return;
  }

  // Validate auth for all other commands except check-auth
  if (args[0] !== '--check-auth') {
    const { valid, error } = config.validate();
    if (!valid) {
      print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
      return;
    }
  }

  const api = new TrelloApiService(config);
  const boardCmd = new BoardCommands(api);
  const listCmd = new ListCommands(api);
  const cardCmd = new CardCommands(api);
  const attachCmd = new AttachmentCommands(api);

  try {
    await executeCommand(
      args,
      config,
      api,
      boardCmd,
      listCmd,
      cardCmd,
      attachCmd
    );
  } catch (ex) {
    print(fail((ex as Error).message, 'ERROR'));
  }
}

async function executeCommand(
  args: string[],
  config: ConfigService,
  api: TrelloApiService,
  boardCmd: BoardCommands,
  listCmd: ListCommands,
  cardCmd: CardCommands,
  attachCmd: AttachmentCommands
): Promise<void> {
  const command = args[0];

  switch (command) {
    // Auth
    case '--check-auth': {
      const { valid, error } = config.validate();
      if (!valid) {
        print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
        return;
      }
      const authResult = await api.checkAuth();
      print(authResult);
      break;
    }

    // Board commands
    case '--get-boards':
      await boardCmd.getBoards();
      break;

    case '--get-board':
      await boardCmd.getBoard(getArg(args, 1));
      break;

    // List commands
    case '--get-lists':
      await listCmd.getLists(getArg(args, 1));
      break;

    case '--create-list':
      await listCmd.createList(getArg(args, 1), getArg(args, 2));
      break;

    // Card commands
    case '--get-cards':
      await cardCmd.getCards(getArg(args, 1));
      break;

    case '--get-all-cards':
      await cardCmd.getAllCards(getArg(args, 1));
      break;

    case '--get-card':
      await cardCmd.getCard(getArg(args, 1));
      break;

    case '--create-card':
      await cardCmd.createCard(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due')
      );
      break;

    case '--update-card':
      await cardCmd.updateCard(
        getArg(args, 1),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due'),
        getNamedArg(args, '--labels'),
        getNamedArg(args, '--members')
      );
      break;

    case '--move-card':
      await cardCmd.moveCard(getArg(args, 1), getArg(args, 2));
      break;

    case '--delete-card':
      await cardCmd.deleteCard(getArg(args, 1));
      break;

    case '--get-comments':
      await cardCmd.getComments(getArg(args, 1));
      break;

    case '--add-comment':
      await cardCmd.addComment(getArg(args, 1), getArg(args, 2));
      break;

    // Attachment commands
    case '--list-attachments':
      await attachCmd.getAttachments(getArg(args, 1));
      break;

    case '--upload-attachment':
      await attachCmd.uploadAttachment(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name')
      );
      break;

    case '--attach-url':
      await attachCmd.attachUrl(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name')
      );
      break;

    case '--delete-attachment':
      await attachCmd.deleteAttachment(getArg(args, 1), getArg(args, 2));
      break;

    default:
      print(fail(`Unknown command: ${command}`, 'UNKNOWN_COMMAND'));
      break;
  }
}

main();
