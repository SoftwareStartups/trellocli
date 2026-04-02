import type { TrelloApiService } from '../services/trelloApiService.js';
import type { ConfigService } from '../services/configService.js';
import type { ApiResponse } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';
import {
  requireParam,
  validateTrelloId,
  validateDate,
  validateColor,
  validateFilePath,
  validateUrl,
} from '../utils/paramValidation.js';
import { fail } from '../models/apiResponse.js';

type Validator = 'trelloId' | 'date' | 'color' | 'filePath' | 'url';

/** Get a required param value (guaranteed present after validateParams) */
function get(params: Record<string, string | undefined>, key: string): string {
  return params[key] ?? '';
}

interface ParamDef {
  name: string;
  label: string;
  source: 'positional' | 'named';
  required?: boolean;
  validate?: Validator;
  /** Named arg flag name, e.g. '--desc' */
  flag?: string;
}

interface CommandDef {
  flag: string;
  description: string;
  group: string;
  params?: ParamDef[];
  /** Special flag params (present/absent), e.g. --due-complete */
  boolFlags?: string[];
  execute: (
    api: TrelloApiService,
    config: ConfigService,
    params: Record<string, string | undefined>
  ) => Promise<void>;
}

function positional(
  name: string,
  label: string,
  validate?: Validator
): ParamDef {
  return { name, label, source: 'positional', required: true, validate };
}

function named(
  name: string,
  label: string,
  flag: string,
  opts?: { validate?: Validator; required?: boolean }
): ParamDef {
  return {
    name,
    label,
    source: 'named',
    flag,
    required: opts?.required,
    validate: opts?.validate,
  };
}

const VALIDATORS: Record<Validator, (v: string, l: string) => boolean> = {
  trelloId: validateTrelloId,
  date: validateDate,
  color: validateColor,
  filePath: validateFilePath,
  url: validateUrl,
};

export function validateParams(
  params: ParamDef[],
  values: Record<string, string | undefined>
): boolean {
  for (const p of params) {
    const val = values[p.name];
    if (p.required && !requireParam(val ?? '', p.label)) return false;
    if (p.validate && val) {
      if (!VALIDATORS[p.validate](val, p.label)) return false;
    }
  }
  return true;
}

function apiCmd(
  flag: string,
  description: string,
  group: string,
  params: ParamDef[],
  apiFn: (
    api: TrelloApiService,
    p: Record<string, string | undefined>
  ) => Promise<ApiResponse<unknown>>,
  opts?: { boolFlags?: string[] }
): CommandDef {
  return {
    flag,
    description,
    group,
    params,
    boolFlags: opts?.boolFlags,
    async execute(api, _config, values) {
      if (!validateParams(params, values)) return;
      const result = await apiFn(api, values);
      print(result);
    },
  };
}

// -- Command definitions --

export const COMMANDS: CommandDef[] = [
  // Board commands
  apiCmd('--get-boards', 'List all boards', 'Board Commands', [], (api) =>
    api.getBoards()
  ),
  apiCmd(
    '--get-board',
    'Get board details',
    'Board Commands',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoard(get(p, 'boardId'))
  ),
  apiCmd(
    '--create-board',
    'Create a new board',
    'Board Commands',
    [
      positional('name', 'Board name'),
      named('desc', 'Description', '--desc'),
      named('workspace', 'Workspace ID', '--workspace'),
    ],
    (api, p) => api.createBoard(get(p, 'name'), p.desc, p.workspace)
  ),
  apiCmd(
    '--get-board-activity',
    'Get board activity',
    'Board Commands',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      named('limit', 'Limit', '--limit'),
    ],
    (api, p) => api.getBoardActivity(get(p, 'boardId'), p.limit)
  ),

  // List commands
  apiCmd(
    '--get-lists',
    'Get lists in a board',
    'List Commands',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getLists(get(p, 'boardId'))
  ),
  apiCmd(
    '--create-list',
    'Create a new list',
    'List Commands',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      positional('name', 'List name'),
    ],
    (api, p) => api.createList(get(p, 'boardId'), get(p, 'name'))
  ),
  apiCmd(
    '--archive-list',
    'Archive a list',
    'List Commands',
    [positional('listId', 'List ID', 'trelloId')],
    (api, p) => api.archiveList(get(p, 'listId'))
  ),

  // Card commands
  apiCmd(
    '--get-cards',
    'Get cards in a list',
    'Card Commands',
    [positional('listId', 'List ID', 'trelloId')],
    (api, p) => api.getCardsInList(get(p, 'listId'))
  ),
  apiCmd(
    '--get-all-cards',
    'Get all cards in a board',
    'Card Commands',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getCardsInBoard(get(p, 'boardId'))
  ),
  apiCmd(
    '--get-my-cards',
    'Get all cards assigned to you',
    'Card Commands',
    [],
    (api) => api.getMyCards()
  ),
  apiCmd(
    '--get-card',
    'Get card details',
    'Card Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getCard(get(p, 'cardId'))
  ),
  apiCmd(
    '--get-card-history',
    'Get card action history',
    'Card Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      named('limit', 'Limit', '--limit'),
    ],
    (api, p) => api.getCardHistory(get(p, 'cardId'), p.limit)
  ),
  apiCmd(
    '--create-card',
    'Create a new card',
    'Card Commands',
    [
      positional('listId', 'List ID', 'trelloId'),
      positional('name', 'Card name'),
      named('desc', 'Description', '--desc'),
      named('due', 'Due date', '--due', { validate: 'date' }),
      named('start', 'Start date', '--start', { validate: 'date' }),
    ],
    (api, p) =>
      api.createCard(get(p, 'listId'), get(p, 'name'), p.desc, p.due, p.start)
  ),
  apiCmd(
    '--update-card',
    'Update a card',
    'Card Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      named('name', 'Name', '--name'),
      named('desc', 'Description', '--desc'),
      named('due', 'Due date', '--due', { validate: 'date' }),
      named('labels', 'Label IDs', '--labels'),
      named('members', 'Member IDs', '--members'),
      named('start', 'Start date', '--start', { validate: 'date' }),
    ],
    (api, p) =>
      api.updateCard(get(p, 'cardId'), {
        name: p.name,
        desc: p.desc,
        due: p.due,
        labels: p.labels,
        members: p.members,
        start: p.start,
        dueComplete: p.dueComplete,
      }),
    { boolFlags: ['--due-complete'] }
  ),
  apiCmd(
    '--move-card',
    'Move a card to another list',
    'Card Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('listId', 'List ID', 'trelloId'),
    ],
    (api, p) => api.moveCard(get(p, 'cardId'), get(p, 'listId'))
  ),
  apiCmd(
    '--copy-card',
    'Copy a card to another list',
    'Card Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('listId', 'Target list ID', 'trelloId'),
      named('keep', 'Keep from source', '--keep'),
    ],
    (api, p) =>
      api.copyCard(get(p, 'cardId'), get(p, 'listId'), p.keep ?? 'all')
  ),
  apiCmd(
    '--archive-card',
    'Archive a card',
    'Card Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.archiveCard(get(p, 'cardId'))
  ),
  apiCmd(
    '--delete-card',
    'Permanently delete a card',
    'Card Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.deleteCard(get(p, 'cardId'))
  ),

  // Comment commands
  apiCmd(
    '--get-comments',
    'Get comments on a card',
    'Comment Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getComments(get(p, 'cardId'))
  ),
  apiCmd(
    '--add-comment',
    'Add a comment to a card',
    'Comment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('text', 'Comment text'),
    ],
    (api, p) => api.addComment(get(p, 'cardId'), get(p, 'text'))
  ),
  apiCmd(
    '--update-comment',
    'Update a comment',
    'Comment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('commentId', 'Comment ID'),
      positional('text', 'Comment text'),
    ],
    (api, p) =>
      api.updateComment(get(p, 'cardId'), get(p, 'commentId'), get(p, 'text'))
  ),
  apiCmd(
    '--delete-comment',
    'Delete a comment',
    'Comment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('commentId', 'Comment ID'),
    ],
    (api, p) => api.deleteComment(get(p, 'cardId'), get(p, 'commentId'))
  ),

  // Attachment commands
  apiCmd(
    '--list-attachments',
    'List attachments on a card',
    'Attachment Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getAttachments(get(p, 'cardId'))
  ),
  apiCmd(
    '--upload-attachment',
    'Upload a file attachment',
    'Attachment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('filePath', 'File path', 'filePath'),
      named('name', 'Name', '--name'),
    ],
    (api, p) =>
      api.uploadAttachment(get(p, 'cardId'), get(p, 'filePath'), p.name)
  ),
  apiCmd(
    '--attach-url',
    'Attach a URL to a card',
    'Attachment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('url', 'URL', 'url'),
      named('name', 'Name', '--name'),
    ],
    (api, p) => api.attachUrl(get(p, 'cardId'), get(p, 'url'), p.name)
  ),
  apiCmd(
    '--delete-attachment',
    'Delete an attachment',
    'Attachment Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('attachmentId', 'Attachment ID', 'trelloId'),
    ],
    (api, p) => api.deleteAttachment(get(p, 'cardId'), get(p, 'attachmentId'))
  ),

  // Label commands
  apiCmd(
    '--get-board-labels',
    'List labels on a board',
    'Label Commands',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoardLabels(get(p, 'boardId'))
  ),
  apiCmd(
    '--create-label',
    'Create a label',
    'Label Commands',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      positional('name', 'Label name'),
      positional('color', 'Label color', 'color'),
    ],
    (api, p) =>
      api.createLabel(get(p, 'boardId'), get(p, 'name'), get(p, 'color'))
  ),
  apiCmd(
    '--update-label',
    'Update a label',
    'Label Commands',
    [
      positional('labelId', 'Label ID', 'trelloId'),
      named('name', 'Name', '--name'),
      named('color', 'Color', '--color', { validate: 'color' }),
    ],
    (api, p) => api.updateLabel(get(p, 'labelId'), p.name, p.color)
  ),
  apiCmd(
    '--delete-label',
    'Delete a label',
    'Label Commands',
    [positional('labelId', 'Label ID', 'trelloId')],
    (api, p) => api.deleteLabel(get(p, 'labelId'))
  ),

  // Member commands
  apiCmd(
    '--get-board-members',
    'List members of a board',
    'Member Commands',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoardMembers(get(p, 'boardId'))
  ),
  apiCmd(
    '--assign-member',
    'Assign a member to a card',
    'Member Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('memberId', 'Member ID', 'trelloId'),
    ],
    (api, p) => api.assignMemberToCard(get(p, 'cardId'), get(p, 'memberId'))
  ),
  apiCmd(
    '--remove-member',
    'Remove a member from a card',
    'Member Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('memberId', 'Member ID', 'trelloId'),
    ],
    (api, p) => api.removeMemberFromCard(get(p, 'cardId'), get(p, 'memberId'))
  ),

  // Workspace commands
  apiCmd(
    '--get-workspaces',
    'List all workspaces',
    'Workspace Commands',
    [],
    (api) => api.getWorkspaces()
  ),
  apiCmd(
    '--get-workspace-boards',
    'List boards in a workspace',
    'Workspace Commands',
    [positional('workspaceId', 'Workspace ID', 'trelloId')],
    (api, p) => api.getWorkspaceBoards(get(p, 'workspaceId'))
  ),

  // Checklist commands
  apiCmd(
    '--get-checklists',
    'List checklists on a card',
    'Checklist Commands',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getChecklists(get(p, 'cardId'))
  ),
  apiCmd(
    '--create-checklist',
    'Create a checklist',
    'Checklist Commands',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('name', 'Checklist name'),
    ],
    (api, p) => api.createChecklist(get(p, 'cardId'), get(p, 'name'))
  ),
  apiCmd(
    '--add-checklist-item',
    'Add an item to a checklist',
    'Checklist Commands',
    [
      positional('checklistId', 'Checklist ID', 'trelloId'),
      positional('name', 'Item name'),
    ],
    (api, p) => api.addCheckItem(get(p, 'checklistId'), get(p, 'name'))
  ),
  {
    flag: '--update-checklist-item',
    description: 'Update a checklist item',
    group: 'Checklist Commands',
    params: [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('checkItemId', 'Check item ID', 'trelloId'),
      named('name', 'Name', '--name'),
      named('state', 'State', '--state'),
    ],
    async execute(api, _config, values) {
      const params = this.params ?? [];
      if (!validateParams(params, values)) return;
      if (
        values.state &&
        values.state !== 'complete' &&
        values.state !== 'incomplete'
      ) {
        print(
          fail('State must be "complete" or "incomplete"', 'INVALID_PARAM')
        );
        return;
      }
      const result = await api.updateCheckItem(
        get(values, 'cardId'),
        get(values, 'checkItemId'),
        values.name,
        values.state
      );
      print(result);
    },
  },
  apiCmd(
    '--delete-checklist',
    'Delete a checklist',
    'Checklist Commands',
    [positional('checklistId', 'Checklist ID', 'trelloId')],
    (api, p) => api.deleteChecklist(get(p, 'checklistId'))
  ),

  // Auth (special — handled via config, not api)
  {
    flag: '--check-auth',
    description: 'Verify authentication',
    group: 'Authentication',
    async execute(api, config) {
      const { valid, error } = config.validate();
      if (!valid) {
        print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
        return;
      }
      print(await api.checkAuth());
    },
  },
];

/** Build lookup map for O(1) dispatch */
export const COMMAND_MAP = new Map(COMMANDS.map((c) => [c.flag, c]));

/** Parse args into param values for a command */
export function parseArgs(
  cmd: CommandDef,
  args: string[]
): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};
  let positionalIndex = 1; // args[0] is the command flag

  for (const p of cmd.params ?? []) {
    if (p.source === 'positional') {
      values[p.name] = args[positionalIndex] ?? '';
      positionalIndex++;
    } else if (p.flag) {
      const flagIndex = args.indexOf(p.flag);
      if (flagIndex !== -1 && flagIndex + 1 < args.length) {
        values[p.name] = args[flagIndex + 1];
      }
    }
  }

  // Handle boolean flags like --due-complete
  for (const bf of cmd.boolFlags ?? []) {
    const camelName = bf
      .replace(/^--/, '')
      .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    values[camelName] = args.includes(bf) ? 'true' : undefined;
  }

  return values;
}

/** Generate help text from command definitions */
export function generateHelp(version: string): string {
  const lines: string[] = [
    `trellocli v${version}`,
    '',
    'Usage: trellocli <command> [options]',
    '',
  ];

  const groups = new Map<string, CommandDef[]>();
  for (const cmd of COMMANDS) {
    const list = groups.get(cmd.group) ?? [];
    list.push(cmd);
    groups.set(cmd.group, list);
  }

  for (const [group, cmds] of groups) {
    lines.push(`${group}:`);
    for (const cmd of cmds) {
      const paramHints = (cmd.params ?? [])
        .map((p) => {
          if (p.source === 'named') return `[${p.flag} "<${p.label}>"]`;
          return p.required ? `<${p.label.toLowerCase()}>` : `[${p.label}]`;
        })
        .join(' ');
      const boolHints = (cmd.boolFlags ?? []).map((f) => `[${f}]`).join(' ');
      const usage = [cmd.flag, paramHints, boolHints].filter(Boolean).join(' ');
      lines.push(`  ${usage.padEnd(50)} ${cmd.description}`);
    }
    lines.push('');
  }

  lines.push('Options:');
  lines.push('  --help, -h                     Show this help');
  lines.push('  --version, -v                  Show version');
  lines.push(
    '  --json                         Output as JSON (default is human-readable text)'
  );
  lines.push('  --no-cache                     Bypass response cache');
  lines.push(
    '  --verbose, --debug             Show HTTP request details on stderr'
  );

  return lines.join('\n');
}
