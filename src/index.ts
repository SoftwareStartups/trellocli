#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
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
import { errorMessage } from './utils/errorUtils.js';

function readVersion(): string {
  try {
    const pkgPath = path.join(import.meta.dir, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return '1.1.0';
  }
}

const VERSION = readVersion();

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

    const { success: ok, error } = config.saveAuth(apiKey, token);
    if (ok) {
      print(success({ message: 'Auth saved to ~/.trello-cli/config.json' }));
    } else {
      print(fail(error ?? 'Unknown error', 'SAVE_ERROR'));
    }
    return;
  }

  if (args[0] === '--clear-auth') {
    const { success: ok, error } = config.clearAuth();
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
    await executeCommand({
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
      checklistCmd,
    });
  } catch (ex) {
    print(fail(errorMessage(ex), 'ERROR'));
  }
}

interface CommandContext {
  args: string[];
  config: ConfigService;
  api: TrelloApiService;
  boardCmd: BoardCommands;
  listCmd: ListCommands;
  cardCmd: CardCommands;
  attachCmd: AttachmentCommands;
  labelCmd: LabelCommands;
  memberCmd: MemberCommands;
  workspaceCmd: WorkspaceCommands;
  checklistCmd: ChecklistCommands;
}

async function executeCommand(ctx: CommandContext): Promise<void> {
  const {
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
    checklistCmd,
  } = ctx;

  const commands: Record<string, () => Promise<void>> = {
    // Auth
    '--check-auth': async () => {
      const { valid, error } = config.validate();
      if (!valid) {
        print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
        return;
      }
      print(await api.checkAuth());
    },

    // Board commands
    '--get-boards': () => boardCmd.getBoards(),
    '--get-board': () => boardCmd.getBoard(getArg(args, 1)),
    '--create-board': () =>
      boardCmd.createBoard(
        getArg(args, 1),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--workspace')
      ),
    '--get-board-activity': () =>
      boardCmd.getBoardActivity(getArg(args, 1), getNamedArg(args, '--limit')),

    // List commands
    '--get-lists': () => listCmd.getLists(getArg(args, 1)),
    '--create-list': () => listCmd.createList(getArg(args, 1), getArg(args, 2)),
    '--archive-list': () => listCmd.archiveList(getArg(args, 1)),

    // Card commands
    '--get-cards': () => cardCmd.getCards(getArg(args, 1)),
    '--get-all-cards': () => cardCmd.getAllCards(getArg(args, 1)),
    '--get-my-cards': () => cardCmd.getMyCards(),
    '--get-card': () => cardCmd.getCard(getArg(args, 1)),
    '--get-card-history': () =>
      cardCmd.getCardHistory(getArg(args, 1), getNamedArg(args, '--limit')),
    '--create-card': () =>
      cardCmd.createCard(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due'),
        getNamedArg(args, '--start')
      ),
    '--update-card': () =>
      cardCmd.updateCard(
        getArg(args, 1),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--desc'),
        getNamedArg(args, '--due'),
        getNamedArg(args, '--labels'),
        getNamedArg(args, '--members'),
        getNamedArg(args, '--start'),
        args.includes('--due-complete') ? 'true' : undefined
      ),
    '--move-card': () => cardCmd.moveCard(getArg(args, 1), getArg(args, 2)),
    '--archive-card': () => cardCmd.archiveCard(getArg(args, 1)),
    '--delete-card': () => cardCmd.deleteCard(getArg(args, 1)),

    // Comment commands
    '--get-comments': () => cardCmd.getComments(getArg(args, 1)),
    '--add-comment': () => cardCmd.addComment(getArg(args, 1), getArg(args, 2)),
    '--update-comment': () =>
      cardCmd.updateComment(getArg(args, 1), getArg(args, 2), getArg(args, 3)),
    '--delete-comment': () =>
      cardCmd.deleteComment(getArg(args, 1), getArg(args, 2)),

    // Attachment commands
    '--list-attachments': () => attachCmd.getAttachments(getArg(args, 1)),
    '--upload-attachment': () =>
      attachCmd.uploadAttachment(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name')
      ),
    '--attach-url': () =>
      attachCmd.attachUrl(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name')
      ),
    '--delete-attachment': () =>
      attachCmd.deleteAttachment(getArg(args, 1), getArg(args, 2)),

    // Label commands
    '--get-board-labels': () => labelCmd.getBoardLabels(getArg(args, 1)),
    '--create-label': () =>
      labelCmd.createLabel(getArg(args, 1), getArg(args, 2), getArg(args, 3)),
    '--update-label': () =>
      labelCmd.updateLabel(
        getArg(args, 1),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--color')
      ),
    '--delete-label': () => labelCmd.deleteLabel(getArg(args, 1)),

    // Member commands
    '--get-board-members': () => memberCmd.getBoardMembers(getArg(args, 1)),
    '--assign-member': () =>
      memberCmd.assignMember(getArg(args, 1), getArg(args, 2)),
    '--remove-member': () =>
      memberCmd.removeMember(getArg(args, 1), getArg(args, 2)),

    // Workspace commands
    '--get-workspaces': () => workspaceCmd.getWorkspaces(),
    '--get-workspace-boards': () =>
      workspaceCmd.getWorkspaceBoards(getArg(args, 1)),

    // Checklist commands
    '--get-checklists': () => checklistCmd.getChecklists(getArg(args, 1)),
    '--create-checklist': () =>
      checklistCmd.createChecklist(getArg(args, 1), getArg(args, 2)),
    '--add-checklist-item': () =>
      checklistCmd.addChecklistItem(getArg(args, 1), getArg(args, 2)),
    '--update-checklist-item': () =>
      checklistCmd.updateChecklistItem(
        getArg(args, 1),
        getArg(args, 2),
        getNamedArg(args, '--name'),
        getNamedArg(args, '--state')
      ),
    '--delete-checklist': () => checklistCmd.deleteChecklist(getArg(args, 1)),
  };

  const handler = commands[args[0]];
  if (handler) {
    await handler();
  } else {
    print(fail(`Unknown command: ${args[0]}`, 'UNKNOWN_COMMAND'));
  }
}

main().catch((ex: unknown) => {
  console.error(
    JSON.stringify({ ok: false, error: errorMessage(ex), code: 'FATAL' })
  );
  process.exit(1);
});
