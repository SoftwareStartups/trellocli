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
import { success, fail } from '../models/apiResponse.js';

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
  noun: string;
  verb: string;
  description: string;
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
  noun: string,
  verb: string,
  description: string,
  params: ParamDef[],
  apiFn: (
    api: TrelloApiService,
    p: Record<string, string | undefined>
  ) => Promise<ApiResponse<unknown>>,
  opts?: { boolFlags?: string[] }
): CommandDef {
  return {
    noun,
    verb,
    description,
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
  apiCmd('boards', 'list', 'List all boards', [], (api) => api.getBoards()),
  apiCmd(
    'boards',
    'get',
    'Get board details',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoard(get(p, 'boardId'))
  ),
  apiCmd(
    'boards',
    'create',
    'Create a new board',
    [
      positional('name', 'Board name'),
      named('desc', 'Description', '--desc'),
      named('workspace', 'Workspace ID', '--workspace'),
    ],
    (api, p) => api.createBoard(get(p, 'name'), p.desc, p.workspace)
  ),
  apiCmd(
    'boards',
    'activity',
    'Get board activity',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      named('limit', 'Limit', '--limit'),
    ],
    (api, p) => api.getBoardActivity(get(p, 'boardId'), p.limit)
  ),

  // List commands
  apiCmd(
    'lists',
    'get',
    'Get lists in a board',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getLists(get(p, 'boardId'))
  ),
  apiCmd(
    'lists',
    'create',
    'Create a new list',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      positional('name', 'List name'),
    ],
    (api, p) => api.createList(get(p, 'boardId'), get(p, 'name'))
  ),
  apiCmd(
    'lists',
    'archive',
    'Archive a list',
    [positional('listId', 'List ID', 'trelloId')],
    (api, p) => api.archiveList(get(p, 'listId'))
  ),

  // Card commands
  apiCmd(
    'cards',
    'list',
    'Get cards in a list',
    [positional('listId', 'List ID', 'trelloId')],
    (api, p) => api.getCardsInList(get(p, 'listId'))
  ),
  apiCmd(
    'cards',
    'list-all',
    'Get all cards in a board',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getCardsInBoard(get(p, 'boardId'))
  ),
  apiCmd('cards', 'mine', 'Get all cards assigned to you', [], (api) =>
    api.getMyCards()
  ),
  apiCmd(
    'cards',
    'get',
    'Get card details',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getCard(get(p, 'cardId'))
  ),
  apiCmd(
    'cards',
    'history',
    'Get card action history',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      named('limit', 'Limit', '--limit'),
    ],
    (api, p) => api.getCardHistory(get(p, 'cardId'), p.limit)
  ),
  apiCmd(
    'cards',
    'create',
    'Create a new card',
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
    'cards',
    'update',
    'Update a card',
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
    'cards',
    'move',
    'Move a card to another list',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('listId', 'List ID', 'trelloId'),
    ],
    (api, p) => api.moveCard(get(p, 'cardId'), get(p, 'listId'))
  ),
  apiCmd(
    'cards',
    'copy',
    'Copy a card to another list',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('listId', 'Target list ID', 'trelloId'),
      named('keep', 'Keep from source', '--keep'),
    ],
    (api, p) =>
      api.copyCard(get(p, 'cardId'), get(p, 'listId'), p.keep ?? 'all')
  ),
  apiCmd(
    'cards',
    'archive',
    'Archive a card',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.archiveCard(get(p, 'cardId'))
  ),
  apiCmd(
    'cards',
    'delete',
    'Permanently delete a card',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.deleteCard(get(p, 'cardId'))
  ),

  // Comment commands
  apiCmd(
    'comments',
    'list',
    'Get comments on a card',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getComments(get(p, 'cardId'))
  ),
  apiCmd(
    'comments',
    'add',
    'Add a comment to a card',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('text', 'Comment text'),
    ],
    (api, p) => api.addComment(get(p, 'cardId'), get(p, 'text'))
  ),
  apiCmd(
    'comments',
    'update',
    'Update a comment',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('commentId', 'Comment ID'),
      positional('text', 'Comment text'),
    ],
    (api, p) =>
      api.updateComment(get(p, 'cardId'), get(p, 'commentId'), get(p, 'text'))
  ),
  apiCmd(
    'comments',
    'delete',
    'Delete a comment',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('commentId', 'Comment ID'),
    ],
    (api, p) => api.deleteComment(get(p, 'cardId'), get(p, 'commentId'))
  ),

  // Attachment commands
  apiCmd(
    'attachments',
    'list',
    'List attachments on a card',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getAttachments(get(p, 'cardId'))
  ),
  apiCmd(
    'attachments',
    'upload',
    'Upload a file attachment',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('filePath', 'File path', 'filePath'),
      named('name', 'Name', '--name'),
    ],
    (api, p) =>
      api.uploadAttachment(get(p, 'cardId'), get(p, 'filePath'), p.name)
  ),
  apiCmd(
    'attachments',
    'attach-url',
    'Attach a URL to a card',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('url', 'URL', 'url'),
      named('name', 'Name', '--name'),
    ],
    (api, p) => api.attachUrl(get(p, 'cardId'), get(p, 'url'), p.name)
  ),
  apiCmd(
    'attachments',
    'delete',
    'Delete an attachment',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('attachmentId', 'Attachment ID', 'trelloId'),
    ],
    (api, p) => api.deleteAttachment(get(p, 'cardId'), get(p, 'attachmentId'))
  ),

  // Label commands
  apiCmd(
    'labels',
    'list',
    'List labels on a board',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoardLabels(get(p, 'boardId'))
  ),
  apiCmd(
    'labels',
    'create',
    'Create a label',
    [
      positional('boardId', 'Board ID', 'trelloId'),
      positional('name', 'Label name'),
      positional('color', 'Label color', 'color'),
    ],
    (api, p) =>
      api.createLabel(get(p, 'boardId'), get(p, 'name'), get(p, 'color'))
  ),
  apiCmd(
    'labels',
    'update',
    'Update a label',
    [
      positional('labelId', 'Label ID', 'trelloId'),
      named('name', 'Name', '--name'),
      named('color', 'Color', '--color', { validate: 'color' }),
    ],
    (api, p) => api.updateLabel(get(p, 'labelId'), p.name, p.color)
  ),
  apiCmd(
    'labels',
    'delete',
    'Delete a label',
    [positional('labelId', 'Label ID', 'trelloId')],
    (api, p) => api.deleteLabel(get(p, 'labelId'))
  ),

  // Member commands
  apiCmd(
    'members',
    'list',
    'List members of a board',
    [positional('boardId', 'Board ID', 'trelloId')],
    (api, p) => api.getBoardMembers(get(p, 'boardId'))
  ),
  apiCmd(
    'members',
    'assign',
    'Assign a member to a card',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('memberId', 'Member ID', 'trelloId'),
    ],
    (api, p) => api.assignMemberToCard(get(p, 'cardId'), get(p, 'memberId'))
  ),
  apiCmd(
    'members',
    'remove',
    'Remove a member from a card',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('memberId', 'Member ID', 'trelloId'),
    ],
    (api, p) => api.removeMemberFromCard(get(p, 'cardId'), get(p, 'memberId'))
  ),

  // Workspace commands
  apiCmd('workspaces', 'list', 'List all workspaces', [], (api) =>
    api.getWorkspaces()
  ),
  apiCmd(
    'workspaces',
    'boards',
    'List boards in a workspace',
    [positional('workspaceId', 'Workspace ID', 'trelloId')],
    (api, p) => api.getWorkspaceBoards(get(p, 'workspaceId'))
  ),

  // Checklist commands
  apiCmd(
    'checklists',
    'list',
    'List checklists on a card',
    [positional('cardId', 'Card ID', 'trelloId')],
    (api, p) => api.getChecklists(get(p, 'cardId'))
  ),
  apiCmd(
    'checklists',
    'create',
    'Create a checklist',
    [
      positional('cardId', 'Card ID', 'trelloId'),
      positional('name', 'Checklist name'),
    ],
    (api, p) => api.createChecklist(get(p, 'cardId'), get(p, 'name'))
  ),
  apiCmd(
    'checklists',
    'add-item',
    'Add an item to a checklist',
    [
      positional('checklistId', 'Checklist ID', 'trelloId'),
      positional('name', 'Item name'),
    ],
    (api, p) => api.addCheckItem(get(p, 'checklistId'), get(p, 'name'))
  ),
  {
    noun: 'checklists',
    verb: 'update-item',
    description: 'Update a checklist item',
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
    'checklists',
    'delete',
    'Delete a checklist',
    [positional('checklistId', 'Checklist ID', 'trelloId')],
    (api, p) => api.deleteChecklist(get(p, 'checklistId'))
  ),

  // Auth commands
  {
    noun: 'auth',
    verb: 'set',
    description: 'Save API key and token',
    params: [positional('apiKey', 'API key'), positional('token', 'Token')],
    async execute(_api, config, values) {
      const params = this.params ?? [];
      if (!validateParams(params, values)) return;
      const apiKey = get(values, 'apiKey');
      const token = get(values, 'token');
      if (!apiKey || !token) {
        print(
          fail('Usage: trellocli auth set <api-key> <token>', 'MISSING_PARAM')
        );
        return;
      }
      const { success: ok, error } = config.saveAuth(apiKey, token);
      if (ok) {
        print(success({ message: 'Auth saved to ~/.trellocli/config.json' }));
      } else {
        print(fail(error ?? 'Unknown error', 'SAVE_ERROR'));
      }
    },
  },
  {
    noun: 'auth',
    verb: 'clear',
    description: 'Clear saved authentication',
    params: [],
    async execute(_api, config) {
      const { success: ok, error } = config.clearAuth();
      if (ok) {
        print(success({ message: 'Auth cleared' }));
      } else {
        print(fail(error ?? 'Unknown error', 'CLEAR_ERROR'));
      }
    },
  },
  {
    noun: 'auth',
    verb: 'check',
    description: 'Verify authentication',
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

/** Build two-level lookup map: noun -> verb -> CommandDef */
export const COMMAND_MAP = new Map<string, Map<string, CommandDef>>();
for (const cmd of COMMANDS) {
  let verbMap = COMMAND_MAP.get(cmd.noun);
  if (!verbMap) {
    verbMap = new Map();
    COMMAND_MAP.set(cmd.noun, verbMap);
  }
  verbMap.set(cmd.verb, cmd);
}

export function getCommand(noun: string, verb: string): CommandDef | undefined {
  return COMMAND_MAP.get(noun)?.get(verb);
}

export function getGroup(noun: string): Map<string, CommandDef> | undefined {
  return COMMAND_MAP.get(noun);
}

/** Parse args into param values for a command (args already stripped of noun+verb) */
export function parseArgs(
  cmd: CommandDef,
  args: string[]
): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};
  let positionalIndex = 0;

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

const NOUN_DESCRIPTIONS: Record<string, string> = {
  boards: 'Manage boards',
  lists: 'Manage lists',
  cards: 'Manage cards',
  comments: 'Manage card comments',
  attachments: 'Manage card attachments',
  labels: 'Manage labels',
  members: 'Manage board members',
  workspaces: 'Manage workspaces',
  checklists: 'Manage checklists',
  auth: 'Authentication',
};

/** Generate top-level help: trellocli --help */
export function generateTopHelp(version: string): string {
  const lines: string[] = [
    `trellocli v${version}`,
    '',
    'Usage: trellocli <command> <subcommand> [args] [options]',
    '',
    'Commands:',
  ];

  for (const [noun, verbMap] of COMMAND_MAP) {
    const desc = NOUN_DESCRIPTIONS[noun] ?? '';
    const verbs = [...verbMap.keys()].join(', ');
    lines.push(`  ${noun.padEnd(16)} ${desc}  (${verbs})`);
  }

  lines.push('');
  lines.push('Options:');
  lines.push('  --help, -h         Show help');
  lines.push('  --version, -v      Show version');
  lines.push(
    '  --json             Output as JSON (default is human-readable text)'
  );
  lines.push('  --no-cache         Bypass response cache');
  lines.push('  --verbose, --debug Show HTTP request details on stderr');
  lines.push('');
  lines.push(
    'Run "trellocli <command> --help" for more information on a command.'
  );

  return lines.join('\n');
}

/** Generate noun-level help: trellocli boards --help */
export function generateNounHelp(noun: string, _version: string): string {
  const verbMap = COMMAND_MAP.get(noun);
  if (!verbMap) return `Unknown command: ${noun}`;

  const lines: string[] = [
    `trellocli ${noun} - ${NOUN_DESCRIPTIONS[noun] ?? ''}`,
    '',
    `Usage: trellocli ${noun} <subcommand> [args] [options]`,
    '',
    'Subcommands:',
  ];

  for (const [verb, cmd] of verbMap) {
    const paramHints = (cmd.params ?? [])
      .filter((p) => p.source === 'positional')
      .map((p) => `<${p.label.toLowerCase()}>`)
      .join(' ');
    const usage = [verb, paramHints].filter(Boolean).join(' ');
    lines.push(`  ${usage.padEnd(40)} ${cmd.description}`);
  }

  lines.push('');
  lines.push(`Run "trellocli ${noun} <subcommand> --help" for details.`);

  return lines.join('\n');
}

/** Generate command-level help: trellocli boards get --help */
export function generateCommandHelp(noun: string, verb: string): string {
  const cmd = getCommand(noun, verb);
  if (!cmd) return `Unknown command: ${noun} ${verb}`;

  const positionals = (cmd.params ?? []).filter(
    (p) => p.source === 'positional'
  );
  const namedParams = (cmd.params ?? []).filter((p) => p.source === 'named');
  const positionalStr = positionals
    .map((p) => `<${p.label.toLowerCase()}>`)
    .join(' ');

  const lines: string[] = [
    cmd.description,
    '',
    `Usage: trellocli ${noun} ${verb}${positionalStr ? ` ${positionalStr}` : ''} [options]`,
  ];

  if (positionals.length > 0) {
    lines.push('', 'Arguments:');
    for (const p of positionals) {
      lines.push(`  <${p.label.toLowerCase().padEnd(20)}> ${p.label}`);
    }
  }

  if (namedParams.length > 0 || (cmd.boolFlags ?? []).length > 0) {
    lines.push('', 'Options:');
    for (const p of namedParams) {
      lines.push(
        `  ${(p.flag ?? '').padEnd(16)} <${p.label.toLowerCase()}>  ${p.label}`
      );
    }
    for (const bf of cmd.boolFlags ?? []) {
      lines.push(`  ${bf}`);
    }
  }

  return lines.join('\n');
}
