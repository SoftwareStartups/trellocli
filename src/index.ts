#!/usr/bin/env bun

import { ConfigService } from './services/configService.js';
import { TrelloApiService } from './services/trelloApiService.js';
import { BoardCommands } from './commands/boardCommands.js';
import { ListCommands } from './commands/listCommands.js';
import { CardCommands } from './commands/cardCommands.js';
import { AttachmentCommands } from './commands/attachmentCommands.js';
import { LabelCommands } from './commands/labelCommands.js';
import { MemberCommands } from './commands/memberCommands.js';
import { WorkspaceCommands } from './commands/workspaceCommands.js';
import { ChecklistCommands } from './commands/checklistCommands.js';
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
  --create-board "<name>" [--desc "<desc>"] [--workspace "<id>"]
  --get-board-activity <board-id> [--limit N]

List Commands:
  --get-lists <board-id>         Get lists in a board
  --create-list <board-id> "<name>"  Create a new list
  --archive-list <list-id>       Archive a list

Card Commands:
  --get-cards <list-id>          Get cards in a list
  --get-all-cards <board-id>     Get all cards in a board
  --get-my-cards                 Get all cards assigned to you
  --get-card <card-id>           Get card details
  --get-card-history <card-id> [--limit N]  Get card action history
  --create-card <list-id> "<name>" [--desc "<desc>"] [--due "YYYY-MM-DD"] [--start "YYYY-MM-DD"]
  --update-card <card-id> [--name "<name>"] [--desc "<desc>"] [--due "<date>"] [--start "<date>"] [--due-complete] [--labels "<ids>"] [--members "<ids>"]
  --move-card <card-id> <target-list-id>
  --archive-card <card-id>       Archive a card
  --delete-card <card-id>        Permanently delete a card

Comment Commands:
  --get-comments <card-id>       Get comments on a card
  --add-comment <card-id> "<text>"  Add a comment
  --update-comment <card-id> <comment-id> "<text>"
  --delete-comment <card-id> <comment-id>

Attachment Commands:
  --list-attachments <card-id>   List attachments on a card
  --upload-attachment <card-id> <file-path> [--name "<name>"]
  --attach-url <card-id> <url> [--name "<name>"]
  --delete-attachment <card-id> <attachment-id>

Label Commands:
  --get-board-labels <board-id>  List labels on a board
  --create-label <board-id> "<name>" "<color>"
  --update-label <label-id> [--name "<name>"] [--color "<color>"]
  --delete-label <label-id>

Member Commands:
  --get-board-members <board-id> List members of a board
  --assign-member <card-id> <member-id>
  --remove-member <card-id> <member-id>

Workspace Commands:
  --get-workspaces               List all workspaces
  --get-workspace-boards <workspace-id>

Checklist Commands:
  --get-checklists <card-id>     List checklists on a card
  --create-checklist <card-id> "<name>"
  --add-checklist-item <checklist-id> "<name>"
  --update-checklist-item <card-id> <item-id> [--name "<name>"] [--state "complete"|"incomplete"]
  --delete-checklist <checklist-id>

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
  const labelCmd = new LabelCommands(api);
  const memberCmd = new MemberCommands(api);
  const workspaceCmd = new WorkspaceCommands(api);
  const checklistCmd = new ChecklistCommands(api);

  try {
    await executeCommand(
      args,
      config,
      api,
      boardCmd,
      listCmd,
      cardCmd,
      attachCmd,
      labelCmd,
      memberCmd,
      workspaceCmd,
      checklistCmd
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
  attachCmd: AttachmentCommands,
  labelCmd: LabelCommands,
  memberCmd: MemberCommands,
  workspaceCmd: WorkspaceCommands,
  checklistCmd: ChecklistCommands
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

    case '--create-board':
      await boardCmd.createBoard(
        getArg(args, 1),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--workspace')
      );
      break;

    case '--get-board-activity':
      await boardCmd.getBoardActivity(
        getArg(args, 1),
        getNamedArg(args, '--limit')
      );
      break;

    // List commands
    case '--get-lists':
      await listCmd.getLists(getArg(args, 1));
      break;

    case '--create-list':
      await listCmd.createList(getArg(args, 1), getArg(args, 2));
      break;

    case '--archive-list':
      await listCmd.archiveList(getArg(args, 1));
      break;

    // Card commands
    case '--get-cards':
      await cardCmd.getCards(getArg(args, 1));
      break;

    case '--get-all-cards':
      await cardCmd.getAllCards(getArg(args, 1));
      break;

    case '--get-my-cards':
      await cardCmd.getMyCards();
      break;

    case '--get-card':
      await cardCmd.getCard(getArg(args, 1));
      break;

    case '--get-card-history':
      await cardCmd.getCardHistory(
        getArg(args, 1),
        getNamedArg(args, '--limit')
      );
      break;

    case '--create-card':
      await cardCmd.createCard(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due'),
        getNamedArg(args, '--start')
      );
      break;

    case '--update-card':
      await cardCmd.updateCard(
        getArg(args, 1),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due'),
        getNamedArg(args, '--labels'),
        getNamedArg(args, '--members'),
        getNamedArg(args, '--start'),
        args.includes('--due-complete') ? 'true' : undefined
      );
      break;

    case '--move-card':
      await cardCmd.moveCard(getArg(args, 1), getArg(args, 2));
      break;

    case '--archive-card':
      await cardCmd.archiveCard(getArg(args, 1));
      break;

    case '--delete-card':
      await cardCmd.deleteCard(getArg(args, 1));
      break;

    // Comment commands
    case '--get-comments':
      await cardCmd.getComments(getArg(args, 1));
      break;

    case '--add-comment':
      await cardCmd.addComment(getArg(args, 1), getArg(args, 2));
      break;

    case '--update-comment':
      await cardCmd.updateComment(
        getArg(args, 1),
        getArg(args, 2),
        getArg(args, 3)
      );
      break;

    case '--delete-comment':
      await cardCmd.deleteComment(getArg(args, 1), getArg(args, 2));
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

    // Label commands
    case '--get-board-labels':
      await labelCmd.getBoardLabels(getArg(args, 1));
      break;

    case '--create-label':
      await labelCmd.createLabel(
        getArg(args, 1),
        getArg(args, 2),
        getArg(args, 3)
      );
      break;

    case '--update-label':
      await labelCmd.updateLabel(
        getArg(args, 1),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--color')
      );
      break;

    case '--delete-label':
      await labelCmd.deleteLabel(getArg(args, 1));
      break;

    // Member commands
    case '--get-board-members':
      await memberCmd.getBoardMembers(getArg(args, 1));
      break;

    case '--assign-member':
      await memberCmd.assignMember(getArg(args, 1), getArg(args, 2));
      break;

    case '--remove-member':
      await memberCmd.removeMember(getArg(args, 1), getArg(args, 2));
      break;

    // Workspace commands
    case '--get-workspaces':
      await workspaceCmd.getWorkspaces();
      break;

    case '--get-workspace-boards':
      await workspaceCmd.getWorkspaceBoards(getArg(args, 1));
      break;

    // Checklist commands
    case '--get-checklists':
      await checklistCmd.getChecklists(getArg(args, 1));
      break;

    case '--create-checklist':
      await checklistCmd.createChecklist(getArg(args, 1), getArg(args, 2));
      break;

    case '--add-checklist-item':
      await checklistCmd.addChecklistItem(getArg(args, 1), getArg(args, 2));
      break;

    case '--update-checklist-item':
      await checklistCmd.updateChecklistItem(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--state')
      );
      break;

    case '--delete-checklist':
      await checklistCmd.deleteChecklist(getArg(args, 1));
      break;

    default:
      print(fail(`Unknown command: ${command}`, 'UNKNOWN_COMMAND'));
      break;
  }
}

main();
