import { describe, test, expect, spyOn } from 'bun:test';
import { CardCommands } from '../../../src/commands/cardCommands.js';
import type { TrelloApiService } from '../../../src/services/trelloApiService.js';
import { success } from '../../../src/models/apiResponse.js';

function makeApi(overrides: Partial<TrelloApiService> = {}): TrelloApiService {
  return {
    getCardsInList: async () => success([]),
    getCardsInBoard: async () => success([]),
    getCard: async () =>
      success({
        id: '507f1f77bcf86cd799439011',
        name: 'C',
        idList: '607f1f77bcf86cd799439022',
        idBoard: 'b1',
      }),
    createCard: async () =>
      success({
        id: 'c2',
        name: 'New',
        idList: '607f1f77bcf86cd799439022',
        idBoard: 'b1',
      }),
    updateCard: async () =>
      success({
        id: '507f1f77bcf86cd799439011',
        name: 'Updated',
        idList: '607f1f77bcf86cd799439022',
        idBoard: 'b1',
      }),
    moveCard: async () =>
      success({
        id: '507f1f77bcf86cd799439011',
        name: 'C',
        idList: '707f1f77bcf86cd799439033',
        idBoard: 'b1',
      }),
    archiveCard: async () =>
      success({
        id: '507f1f77bcf86cd799439011',
        name: 'C',
        idList: '607f1f77bcf86cd799439022',
        idBoard: 'b1',
      }),
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
    ...overrides,
  } as unknown as TrelloApiService;
}

function captureOutput(): {
  spy: ReturnType<typeof spyOn>;
  getOutput: () => unknown;
} {
  const spy = spyOn(console, 'log').mockImplementation(() => {});
  return {
    spy,
    getOutput: () => JSON.parse(spy.mock.calls[0]?.[0] as string),
  };
}

describe('CardCommands', () => {
  describe('getCards', () => {
    test('prints cards from list', async () => {
      const cards = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Card',
          idList: '607f1f77bcf86cd799439022',
          idBoard: 'b1',
        },
      ];
      const cmd = new CardCommands(
        makeApi({ getCardsInList: async () => success(cards) })
      );
      const { spy, getOutput } = captureOutput();
      await cmd.getCards('607f1f77bcf86cd799439022');
      expect(getOutput()).toEqual({ ok: true, data: cards });
      spy.mockRestore();
    });

    test('prints error when list ID missing', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.getCards('');
      const output = getOutput() as { ok: boolean; code: string };
      expect(output.ok).toBe(false);
      expect(output.code).toBe('MISSING_PARAM');
      spy.mockRestore();
    });
  });

  describe('getCard', () => {
    test('prints card details', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.getCard('507f1f77bcf86cd799439011');
      const output = getOutput() as { ok: boolean; data: { id: string } };
      expect(output.ok).toBe(true);
      expect(output.data.id).toBe('507f1f77bcf86cd799439011');
      spy.mockRestore();
    });
  });

  describe('createCard', () => {
    test('requires list ID', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.createCard('', 'name');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();
    });

    test('requires card name', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.createCard('607f1f77bcf86cd799439022', '');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();
    });

    test('creates card with all fields', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.createCard(
        '607f1f77bcf86cd799439022',
        'Test',
        'desc',
        '2025-01-15',
        '2025-01-10'
      );
      expect((getOutput() as { ok: boolean }).ok).toBe(true);
      spy.mockRestore();
    });
  });

  describe('updateCard', () => {
    test('requires card ID', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.updateCard('');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();
    });

    test('passes update fields through', async () => {
      const cmd = new CardCommands(
        makeApi({
          updateCard: async (_id, opts) => {
            expect(opts.name).toBe('New Name');
            return success({
              id: '507f1f77bcf86cd799439011',
              name: 'New Name',
              idList: '607f1f77bcf86cd799439022',
              idBoard: 'b1',
            });
          },
        })
      );
      const { spy } = captureOutput();
      await cmd.updateCard('507f1f77bcf86cd799439011', 'New Name');
      spy.mockRestore();
    });
  });

  describe('moveCard', () => {
    test('requires both card ID and list ID', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.moveCard('', '707f1f77bcf86cd799439033');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();

      const { spy: spy2, getOutput: getOutput2 } = captureOutput();
      await cmd.moveCard('507f1f77bcf86cd799439011', '');
      expect((getOutput2() as { ok: boolean }).ok).toBe(false);
      spy2.mockRestore();
    });
  });

  describe('addComment', () => {
    test('requires card ID and text', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.addComment('', 'text');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();

      const { spy: spy2, getOutput: getOutput2 } = captureOutput();
      await cmd.addComment('507f1f77bcf86cd799439011', '');
      expect((getOutput2() as { ok: boolean }).ok).toBe(false);
      spy2.mockRestore();
    });
  });

  describe('getMyCards', () => {
    test('fetches user cards without params', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.getMyCards();
      expect((getOutput() as { ok: boolean }).ok).toBe(true);
      spy.mockRestore();
    });
  });

  describe('getCardHistory', () => {
    test('requires card ID', async () => {
      const cmd = new CardCommands(makeApi());
      const { spy, getOutput } = captureOutput();
      await cmd.getCardHistory('');
      expect((getOutput() as { ok: boolean }).ok).toBe(false);
      spy.mockRestore();
    });

    test('passes limit through', async () => {
      const cmd = new CardCommands(
        makeApi({
          getCardHistory: async (_cardId, limit) => {
            expect(limit).toBe('10');
            return success([]);
          },
        })
      );
      const { spy } = captureOutput();
      await cmd.getCardHistory('507f1f77bcf86cd799439011', '10');
      spy.mockRestore();
    });
  });
});
