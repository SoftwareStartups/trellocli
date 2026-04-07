import { describe, test, expect, spyOn, afterEach } from 'bun:test';
import {
  COMMANDS,
  COMMAND_MAP,
  getCommand,
  parseArgs,
  validateParams,
  generateTopHelp,
  generateNounHelp,
  generateCommandHelp,
} from '../../../src/commands/registry.js';
import type { TrelloApiService } from '../../../src/services/trelloApiService.js';
import { success } from '../../../src/models/apiResponse.js';
import { TEST_ID, TEST_ID_2, makeConfig } from '../../helpers/testUtils.js';

function makeApi(overrides: Partial<TrelloApiService> = {}): TrelloApiService {
  return {
    getCardsInList: async () => success([]),
    getCardsInBoard: async () => success([]),
    getCard: async () =>
      success({ id: TEST_ID, name: 'C', idList: TEST_ID_2, idBoard: 'b1' }),
    createCard: async () =>
      success({ id: 'c2', name: 'New', idList: TEST_ID_2, idBoard: 'b1' }),
    updateCard: async () =>
      success({
        id: TEST_ID,
        name: 'Updated',
        idList: TEST_ID_2,
        idBoard: 'b1',
      }),
    moveCard: async () =>
      success({ id: TEST_ID, name: 'C', idList: TEST_ID_2, idBoard: 'b1' }),
    archiveCard: async () =>
      success({ id: TEST_ID, name: 'C', idList: TEST_ID_2, idBoard: 'b1' }),
    deleteCard: async () => success({ deleted: true }),
    getComments: async () => success([]),
    addComment: async () =>
      success({
        id: 'a1',
        date: '',
        data: { text: '' },
        memberCreator: { id: '', fullName: '', username: '' },
      }),
    updateComment: async () =>
      success({
        id: 'a1',
        date: '',
        data: { text: '' },
        memberCreator: { id: '', fullName: '', username: '' },
      }),
    deleteComment: async () => success({ deleted: true }),
    getMyCards: async () => success([]),
    getCardHistory: async () => success([]),
    copyCard: async () =>
      success({ id: 'c3', name: 'C', idList: TEST_ID_2, idBoard: 'b1' }),
    getBoards: async () => success([]),
    getBoard: async () => success({ id: 'b1', name: 'B', url: '' }),
    createBoard: async () => success({ id: 'b2', name: 'B', url: '' }),
    getBoardActivity: async () => success([]),
    getLists: async () => success([]),
    createList: async () => success({ id: 'l1', name: 'L', idBoard: 'b1' }),
    archiveList: async () =>
      success({ id: 'l1', name: 'L', idBoard: 'b1', closed: true }),
    getAttachments: async () => success([]),
    uploadAttachment: async () =>
      success({ id: 'at1', name: 'F', url: '', date: '', isUpload: true }),
    attachUrl: async () =>
      success({ id: 'at2', name: 'L', url: '', date: '', isUpload: false }),
    deleteAttachment: async () => success({ deleted: true }),
    getBoardLabels: async () => success([]),
    createLabel: async () => success({ id: 'lb1', name: 'L', color: 'red' }),
    updateLabel: async () => success({ id: 'lb1', name: 'L', color: 'blue' }),
    deleteLabel: async () => success({ deleted: true }),
    getBoardMembers: async () => success([]),
    assignMemberToCard: async () => success([]),
    removeMemberFromCard: async () => success({ removed: true }),
    getWorkspaces: async () => success([]),
    getWorkspaceBoards: async () => success([]),
    getChecklists: async () => success([]),
    createChecklist: async () =>
      success({ id: 'cl1', name: 'CL', checkItems: [] }),
    addCheckItem: async () =>
      success({
        id: 'ci1',
        name: 'I',
        state: 'incomplete',
        idChecklist: 'cl1',
        pos: 1,
      }),
    updateCheckItem: async () =>
      success({
        id: 'ci1',
        name: 'I',
        state: 'complete',
        idChecklist: 'cl1',
        pos: 1,
      }),
    deleteChecklist: async () => success({ deleted: true }),
    checkAuth: async () =>
      success({ id: 'm1', fullName: 'Test', username: 'test' }),
    ...overrides,
  } as unknown as TrelloApiService;
}

function getCmd(noun: string, verb: string) {
  const cmd = getCommand(noun, verb);
  if (!cmd) throw new Error(`Command ${noun} ${verb} not found`);
  return cmd;
}

let logSpy: ReturnType<typeof spyOn>;

afterEach(() => {
  logSpy?.mockRestore();
});

function captureOutput(): () => unknown {
  logSpy = spyOn(console, 'log').mockImplementation(() => {});
  return () => JSON.parse(logSpy.mock.calls[0]?.[0] as string);
}

describe('Command Registry', () => {
  describe('COMMAND_MAP', () => {
    test('contains all registered commands', () => {
      let total = 0;
      for (const [, verbMap] of COMMAND_MAP) {
        total += verbMap.size;
      }
      expect(total).toBe(COMMANDS.length);
      for (const cmd of COMMANDS) {
        expect(getCommand(cmd.noun, cmd.verb)).toBeDefined();
      }
    });
  });

  describe('parseArgs', () => {
    test('parses positional args', () => {
      const cmd = getCmd('cards', 'list');
      const result = parseArgs(cmd, [TEST_ID]);
      expect(result.listId).toBe(TEST_ID);
    });

    test('parses named args', () => {
      const cmd = getCmd('cards', 'create');
      const result = parseArgs(cmd, [
        TEST_ID,
        'My Card',
        '--desc',
        'Description',
        '--due',
        '2025-01-15',
      ]);
      expect(result.listId).toBe(TEST_ID);
      expect(result.name).toBe('My Card');
      expect(result.desc).toBe('Description');
      expect(result.due).toBe('2025-01-15');
    });

    test('parses boolean flags', () => {
      const cmd = getCmd('cards', 'update');
      const result = parseArgs(cmd, [TEST_ID, '--due-complete']);
      expect(result.dueComplete).toBe('true');
    });

    test('leaves missing named args undefined', () => {
      const cmd = getCmd('cards', 'create');
      const result = parseArgs(cmd, [TEST_ID, 'Name']);
      expect(result.desc).toBeUndefined();
      expect(result.due).toBeUndefined();
    });
  });

  describe('validateParams', () => {
    test('validates required params', () => {
      const getOutput = captureOutput();
      const cmd = getCmd('cards', 'list');
      const valid = validateParams(cmd.params ?? [], { listId: '' });
      expect(valid).toBe(false);
      const output = getOutput() as { ok: boolean; code: string };
      expect(output.ok).toBe(false);
      expect(output.code).toBe('MISSING_PARAM');
    });

    test('validates trello ID format', () => {
      const getOutput = captureOutput();
      const cmd = getCmd('cards', 'list');
      const valid = validateParams(cmd.params ?? [], { listId: 'bad-id' });
      expect(valid).toBe(false);
      const output = getOutput() as { ok: boolean; code: string };
      expect(output.code).toBe('INVALID_PARAM');
    });

    test('validates date format', () => {
      const getOutput = captureOutput();
      const cmd = getCmd('cards', 'create');
      const valid = validateParams(cmd.params ?? [], {
        listId: TEST_ID,
        name: 'Card',
        due: 'not-a-date',
      });
      expect(valid).toBe(false);
      const output = getOutput() as { ok: boolean; code: string };
      expect(output.code).toBe('INVALID_PARAM');
    });

    test('skips validation for absent optional params', () => {
      const cmd = getCmd('cards', 'create');
      const valid = validateParams(cmd.params ?? [], {
        listId: TEST_ID,
        name: 'Card',
      });
      expect(valid).toBe(true);
    });
  });

  describe('command execution', () => {
    test('cards list prints result', async () => {
      const cards = [
        { id: TEST_ID, name: 'Card', idList: TEST_ID_2, idBoard: 'b1' },
      ];
      const api = makeApi({ getCardsInList: async () => success(cards) });
      const cmd = getCmd('cards', 'list');
      const getOutput = captureOutput();
      await cmd.execute(api, makeConfig(), { listId: TEST_ID_2 });
      expect(getOutput()).toEqual({ ok: true, data: cards });
    });

    test('cards list rejects missing list ID', async () => {
      const cmd = getCmd('cards', 'list');
      const getOutput = captureOutput();
      await cmd.execute(makeApi(), makeConfig(), { listId: '' });
      const output = getOutput() as { ok: boolean; code: string };
      expect(output.ok).toBe(false);
      expect(output.code).toBe('MISSING_PARAM');
    });

    test('cards create passes all fields', async () => {
      const cmd = getCmd('cards', 'create');
      const getOutput = captureOutput();
      await cmd.execute(makeApi(), makeConfig(), {
        listId: TEST_ID_2,
        name: 'Test',
        desc: 'desc',
        due: '2025-01-15',
        start: '2025-01-10',
      });
      expect((getOutput() as { ok: boolean }).ok).toBe(true);
    });

    test('cards update passes fields through', async () => {
      const api = makeApi({
        updateCard: async (_id, opts) => {
          expect(opts.name).toBe('New Name');
          return success({
            id: TEST_ID,
            name: 'New Name',
            idList: TEST_ID_2,
            idBoard: 'b1',
          });
        },
      });
      const cmd = getCmd('cards', 'update');
      const getOutput = captureOutput();
      await cmd.execute(api, makeConfig(), {
        cardId: TEST_ID,
        name: 'New Name',
      });
      expect((getOutput() as { ok: boolean }).ok).toBe(true);
    });

    test('cards move requires both IDs', async () => {
      const cmd = getCmd('cards', 'move');
      const getOutput = captureOutput();
      await cmd.execute(makeApi(), makeConfig(), {
        cardId: '',
        listId: TEST_ID_2,
      });
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
    });

    test('comments add requires card ID and text', async () => {
      const cmd = getCmd('comments', 'add');
      const getOutput = captureOutput();
      await cmd.execute(makeApi(), makeConfig(), { cardId: '', text: 'hi' });
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
    });

    test('cards mine works without params', async () => {
      const cmd = getCmd('cards', 'mine');
      const getOutput = captureOutput();
      await cmd.execute(makeApi(), makeConfig(), {});
      expect((getOutput() as { ok: boolean }).ok).toBe(true);
    });

    test('cards history passes limit', async () => {
      const api = makeApi({
        getCardHistory: async (_cardId, limit) => {
          expect(limit).toBe('10');
          return success([]);
        },
      });
      const cmd = getCmd('cards', 'history');
      captureOutput();
      await cmd.execute(api, makeConfig(), {
        cardId: TEST_ID,
        limit: '10',
      });
    });

    test('cards copy defaults keep to all', async () => {
      const api = makeApi({
        copyCard: async (_cardId, _listId, keep) => {
          expect(keep).toBe('all');
          return success({
            id: 'c3',
            name: 'C',
            idList: TEST_ID_2,
            idBoard: 'b1',
          });
        },
      });
      const cmd = getCmd('cards', 'copy');
      captureOutput();
      await cmd.execute(api, makeConfig(), {
        cardId: TEST_ID,
        listId: TEST_ID_2,
      });
    });
  });

  describe('generateTopHelp', () => {
    test('includes version', () => {
      const help = generateTopHelp('1.2.3');
      expect(help).toContain('trellocli v1.2.3');
    });

    test('lists all command groups', () => {
      const help = generateTopHelp('1.0.0');
      expect(help).toContain('boards');
      expect(help).toContain('cards');
      expect(help).toContain('checklists');
      expect(help).toContain('auth');
    });

    test('includes top-level login and logout commands', () => {
      const help = generateTopHelp('1.0.0');
      expect(help).toContain('login');
      expect(help).toContain('logout');
      expect(help).toContain('Top-level Commands:');
    });

    test('includes options section', () => {
      const help = generateTopHelp('1.0.0');
      expect(help).toContain('--help');
      expect(help).toContain('--json');
      expect(help).toContain('--verbose');
    });
  });

  describe('generateNounHelp', () => {
    test('lists verbs for a noun', () => {
      const help = generateNounHelp('boards', '1.0.0');
      expect(help).toContain('list');
      expect(help).toContain('get');
      expect(help).toContain('create');
      expect(help).toContain('activity');
    });

    test('returns error for unknown noun', () => {
      const help = generateNounHelp('unknown', '1.0.0');
      expect(help).toContain('Unknown command');
    });
  });

  describe('generateCommandHelp', () => {
    test('shows usage and params', () => {
      const help = generateCommandHelp('boards', 'get');
      expect(help).toContain('Get board details');
      expect(help).toContain('<board id>');
      expect(help).toContain('trellocli boards get');
    });

    test('shows named options', () => {
      const help = generateCommandHelp('cards', 'create');
      expect(help).toContain('--desc');
      expect(help).toContain('--due');
    });

    test('returns error for unknown command', () => {
      const help = generateCommandHelp('boards', 'unknown');
      expect(help).toContain('Unknown command');
    });
  });
});
