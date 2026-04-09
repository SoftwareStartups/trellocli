import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type mock,
  test,
} from 'bun:test';
import { TrelloApiService } from '../../../src/services/trelloApiService.js';
import {
  mockFetchError,
  mockFetchResponse,
  restoreFetch,
} from '../../helpers/mockFetch.js';
import { TEST_API_KEY, TEST_TOKEN } from '../../helpers/testUtils.js';

function getLastFetchUrl(): string {
  return (globalThis.fetch as ReturnType<typeof mock>).mock
    .calls[0][0] as string;
}

function getLastFetchOpts(): RequestInit {
  return (globalThis.fetch as ReturnType<typeof mock>).mock
    .calls[0][1] as RequestInit;
}

describe('TrelloApiService', () => {
  let api: TrelloApiService;
  const originalFetch = globalThis.fetch;
  const originalRetryBase = process.env.TRELLO_RETRY_BASE_MS;

  beforeEach(() => {
    process.env.TRELLO_RETRY_BASE_MS = '1';
    api = new TrelloApiService(TEST_API_KEY, TEST_TOKEN);
  });

  afterEach(() => {
    restoreFetch(originalFetch);
    process.exitCode = undefined;
    if (originalRetryBase !== undefined) {
      process.env.TRELLO_RETRY_BASE_MS = originalRetryBase;
    } else {
      delete process.env.TRELLO_RETRY_BASE_MS;
    }
  });

  // -- checkAuth --
  describe('checkAuth', () => {
    test('returns member on success', async () => {
      const member = { id: 'm1', fullName: 'Test', username: 'test' };
      mockFetchResponse({ body: member });
      const result = await api.checkAuth();
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(member);
    });

    test('returns AUTH_ERROR on non-ok response', async () => {
      mockFetchResponse({ status: 401 });
      const result = await api.checkAuth();
      expect(result.ok).toBe(false);
      expect(result.code).toBe('AUTH_ERROR');
    });

    test('returns HTTP_ERROR on network error', async () => {
      mockFetchError('Network failure');
      const result = await api.checkAuth();
      expect(result.ok).toBe(false);
      expect(result.code).toBe('HTTP_ERROR');
      expect(result.error).toContain('Network failure');
    });
  });

  // -- Board operations --
  describe('getBoards', () => {
    test('fetches open boards', async () => {
      const boards = [{ id: 'b1', name: 'Board 1', url: 'http://...' }];
      mockFetchResponse({ body: boards });
      const result = await api.getBoards();
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(boards);
      const url = getLastFetchUrl();
      expect(url).toContain('/members/me/boards');
      expect(url).toContain('filter=open');
    });
  });

  describe('getBoard', () => {
    test('fetches specific board', async () => {
      const board = { id: 'b1', name: 'B', url: 'http://...' };
      mockFetchResponse({ body: board });
      const result = await api.getBoard('b1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(board);
    });

    test('returns NOT_FOUND on 404', async () => {
      mockFetchResponse({ status: 404 });
      const result = await api.getBoard('bad');
      expect(result.ok).toBe(false);
      expect(result.code).toBe('NOT_FOUND');
    });
  });

  describe('createBoard', () => {
    test('creates board with name', async () => {
      const board = { id: 'b2', name: 'New', url: 'http://...' };
      mockFetchResponse({ body: board });
      const result = await api.createBoard('New');
      expect(result.ok).toBe(true);
      expect(getLastFetchOpts().method).toBe('POST');
    });

    test('creates board with desc and workspace', async () => {
      mockFetchResponse({ body: { id: 'b3', name: 'X', url: '' } });
      await api.createBoard('X', 'desc here', 'ws1');
      const body = getLastFetchOpts().body as URLSearchParams;
      expect(body.get('desc')).toBe('desc here');
      expect(body.get('idOrganization')).toBe('ws1');
    });
  });

  // -- List operations --
  describe('getLists', () => {
    test('fetches open lists for board', async () => {
      const lists = [{ id: 'l1', name: 'Todo', idBoard: 'b1' }];
      mockFetchResponse({ body: lists });
      const result = await api.getLists('b1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(lists);
    });
  });

  describe('createList', () => {
    test('creates list in board', async () => {
      mockFetchResponse({ body: { id: 'l2', name: 'Done', idBoard: 'b1' } });
      const result = await api.createList('b1', 'Done');
      expect(result.ok).toBe(true);
      const url = getLastFetchUrl();
      expect(url).toContain('name=Done');
      expect(url).toContain('idBoard=b1');
    });

    test('encodes special characters in name', async () => {
      mockFetchResponse({ body: { id: 'l3', name: 'A & B', idBoard: 'b1' } });
      await api.createList('b1', 'A & B');
      expect(getLastFetchUrl()).toContain('name=A%20%26%20B');
    });
  });

  describe('archiveList', () => {
    test('archives list via PUT', async () => {
      mockFetchResponse({
        body: { id: 'l1', name: 'X', idBoard: 'b1', closed: true },
      });
      const result = await api.archiveList('l1');
      expect(result.ok).toBe(true);
      expect(getLastFetchUrl()).toContain('/lists/l1/closed');
      expect(getLastFetchOpts().method).toBe('PUT');
    });
  });

  // -- Card operations --
  describe('getCardsInList', () => {
    test('fetches cards for list', async () => {
      const cards = [{ id: 'c1', name: 'Card', idList: 'l1', idBoard: 'b1' }];
      mockFetchResponse({ body: cards });
      const result = await api.getCardsInList('l1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(cards);
    });
  });

  describe('createCard', () => {
    test('creates card with required fields', async () => {
      mockFetchResponse({
        body: { id: 'c2', name: 'New', idList: 'l1', idBoard: 'b1' },
      });
      const result = await api.createCard('l1', 'New');
      expect(result.ok).toBe(true);
      const body = getLastFetchOpts().body as URLSearchParams;
      expect(body.get('idList')).toBe('l1');
      expect(body.get('name')).toBe('New');
    });

    test('includes optional fields when provided', async () => {
      mockFetchResponse({
        body: { id: 'c3', name: 'C', idList: 'l1', idBoard: 'b1' },
      });
      await api.createCard('l1', 'C', 'desc', '2025-01-15', '2025-01-10');
      const body = getLastFetchOpts().body as URLSearchParams;
      expect(body.get('desc')).toBe('desc');
      expect(body.get('due')).toBe('2025-01-15');
      expect(body.get('start')).toBe('2025-01-10');
    });
  });

  describe('updateCard', () => {
    test('updates card with provided fields', async () => {
      mockFetchResponse({
        body: { id: 'c1', name: 'Updated', idList: 'l1', idBoard: 'b1' },
      });
      const result = await api.updateCard('c1', { name: 'Updated' });
      expect(result.ok).toBe(true);
    });

    test('returns NO_PARAMS when no fields provided', async () => {
      const result = await api.updateCard('c1', {});
      expect(result.ok).toBe(false);
      expect(result.code).toBe('NO_PARAMS');
    });
  });

  describe('moveCard', () => {
    test('delegates to updateCard with listId', async () => {
      mockFetchResponse({
        body: { id: 'c1', name: 'C', idList: 'l2', idBoard: 'b1' },
      });
      const result = await api.moveCard('c1', 'l2');
      expect(result.ok).toBe(true);
      const body = getLastFetchOpts().body as URLSearchParams;
      expect(body.get('idList')).toBe('l2');
    });
  });

  describe('deleteCard', () => {
    test('returns successValue on delete', async () => {
      mockFetchResponse({ body: {} });
      const result = await api.deleteCard('c1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
  });

  // -- Comment operations --
  describe('getComments', () => {
    test('fetches comments with commentCard filter', async () => {
      mockFetchResponse({ body: [] });
      await api.getComments('c1');
      expect(getLastFetchUrl()).toContain('filter=commentCard');
    });
  });

  describe('addComment', () => {
    test('posts comment text', async () => {
      mockFetchResponse({
        body: {
          id: 'a1',
          date: '',
          data: { text: 'hi' },
          memberCreator: { id: '', fullName: '', username: '' },
        },
      });
      const result = await api.addComment('c1', 'hi');
      expect(result.ok).toBe(true);
      expect(getLastFetchUrl()).toContain('text=hi');
    });
  });

  describe('deleteComment', () => {
    test('deletes comment and returns successValue', async () => {
      mockFetchResponse({ body: {} });
      const result = await api.deleteComment('c1', 'a1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
  });

  // -- Label operations --
  describe('getBoardLabels', () => {
    test('fetches labels for board', async () => {
      const labels = [{ id: 'lb1', name: 'Bug', color: 'red' }];
      mockFetchResponse({ body: labels });
      const result = await api.getBoardLabels('b1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(labels);
    });
  });

  describe('updateLabel', () => {
    test('returns NO_PARAMS when no fields provided', async () => {
      const result = await api.updateLabel('lb1');
      expect(result.ok).toBe(false);
      expect(result.code).toBe('NO_PARAMS');
    });

    test('updates label name', async () => {
      mockFetchResponse({
        body: { id: 'lb1', name: 'Feature', color: 'blue' },
      });
      const result = await api.updateLabel('lb1', 'Feature');
      expect(result.ok).toBe(true);
    });
  });

  // -- Member operations --
  describe('getBoardMembers', () => {
    test('fetches members for board', async () => {
      const members = [{ id: 'm1', fullName: 'User', username: 'user' }];
      mockFetchResponse({ body: members });
      const result = await api.getBoardMembers('b1');
      expect(result.ok).toBe(true);
    });
  });

  // -- Workspace operations --
  describe('getWorkspaces', () => {
    test('fetches workspaces', async () => {
      mockFetchResponse({ body: [] });
      const result = await api.getWorkspaces();
      expect(result.ok).toBe(true);
    });
  });

  // -- Checklist operations --
  describe('getChecklists', () => {
    test('fetches checklists for card', async () => {
      mockFetchResponse({ body: [] });
      const result = await api.getChecklists('c1');
      expect(result.ok).toBe(true);
    });
  });

  describe('updateCheckItem', () => {
    test('returns NO_PARAMS when no fields provided', async () => {
      const result = await api.updateCheckItem('c1', 'ci1');
      expect(result.ok).toBe(false);
      expect(result.code).toBe('NO_PARAMS');
    });

    test('updates check item state', async () => {
      mockFetchResponse({
        body: {
          id: 'ci1',
          name: 'Item',
          state: 'complete',
          idChecklist: 'cl1',
          pos: 1,
        },
      });
      const result = await api.updateCheckItem(
        'c1',
        'ci1',
        undefined,
        'complete'
      );
      expect(result.ok).toBe(true);
    });
  });

  // -- Attachment operations --
  describe('getAttachments', () => {
    test('fetches attachments for card', async () => {
      mockFetchResponse({ body: [] });
      const result = await api.getAttachments('c1');
      expect(result.ok).toBe(true);
    });
  });

  describe('attachUrl', () => {
    test('attaches URL to card', async () => {
      mockFetchResponse({
        body: {
          id: 'at1',
          name: 'Link',
          url: 'https://example.com',
          date: '',
          isUpload: false,
        },
      });
      const result = await api.attachUrl('c1', 'https://example.com', 'Link');
      expect(result.ok).toBe(true);
    });
  });

  describe('deleteAttachment', () => {
    test('deletes attachment', async () => {
      mockFetchResponse({ body: {} });
      const result = await api.deleteAttachment('c1', 'at1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
  });

  // -- Generic error handling --
  describe('request error handling', () => {
    test('returns HTTP_ERROR on non-ok status (non-retryable)', async () => {
      mockFetchResponse({ status: 400 });
      const result = await api.getBoards();
      expect(result.ok).toBe(false);
      expect(result.code).toBe('HTTP_ERROR');
      expect(result.error).toBe('HTTP 400');
    });

    test('returns HTTP_ERROR on network failure (after retries)', async () => {
      mockFetchError('fetch failed');
      const result = await api.getBoards();
      expect(result.ok).toBe(false);
      expect(result.code).toBe('HTTP_ERROR');
      expect(result.error).toContain('fetch failed');
    });

    test('includes auth params in URL', async () => {
      mockFetchResponse({ body: [] });
      await api.getBoards();
      const url = getLastFetchUrl();
      expect(url).toContain('key=test-key');
      expect(url).toContain('token=test-token');
    });
  });

  // -- Field filtering --
  describe('field filtering', () => {
    test('strips extra fields from single objects', async () => {
      mockFetchResponse({
        body: {
          id: 'b1',
          name: 'Board',
          desc: '',
          url: 'http://b',
          closed: false,
          starred: true,
          prefs: { background: 'blue' },
          memberships: [{ id: 'm1' }],
          dateLastActivity: '2025-01-01',
          labelNames: { green: '' },
        },
      });
      const result = await api.getBoard('b1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        id: 'b1',
        name: 'Board',
        desc: '',
        url: 'http://b',
        closed: false,
      });
    });

    test('strips extra fields from arrays', async () => {
      mockFetchResponse({
        body: [
          {
            id: 'b1',
            name: 'A',
            url: 'http://a',
            starred: true,
            prefs: {},
          },
          {
            id: 'b2',
            name: 'B',
            url: 'http://b',
            dateLastView: '2025-01-01',
          },
        ],
      });
      const result = await api.getBoards();
      expect(result.ok).toBe(true);
      expect(result.data).toEqual([
        { id: 'b1', name: 'A', url: 'http://a' },
        { id: 'b2', name: 'B', url: 'http://b' },
      ]);
    });

    test('strips nested comment data and memberCreator', async () => {
      mockFetchResponse({
        body: [
          {
            id: 'a1',
            type: 'commentCard',
            date: '2025-01-01',
            data: {
              text: 'hello',
              textData: { emoji: {} },
              board: { id: 'b1', name: 'B', shortLink: 'x' },
              card: { id: 'c1', name: 'C', shortLink: 'y', idShort: 1 },
              list: { id: 'l1', name: 'L' },
            },
            memberCreator: {
              id: 'm1',
              fullName: 'Alice',
              username: 'alice',
              avatarHash: 'abc',
              initials: 'A',
            },
            limits: {},
            display: { translationKey: 'x' },
          },
        ],
      });
      const result = await api.getComments('c1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual([
        {
          id: 'a1',
          date: '2025-01-01',
          data: { text: 'hello' },
          memberCreator: { id: 'm1', fullName: 'Alice', username: 'alice' },
        },
      ]);
    });

    test('strips extra fields from write responses', async () => {
      mockFetchResponse({
        body: {
          id: 'b2',
          name: 'New',
          url: 'http://new',
          starred: false,
          prefs: { background: 'green' },
          shortLink: 'abc',
        },
      });
      const result = await api.createBoard('New');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        id: 'b2',
        name: 'New',
        url: 'http://new',
      });
    });

    test('sends fields param in board GET URL', async () => {
      mockFetchResponse({ body: [] });
      await api.getBoards();
      const url = getLastFetchUrl();
      expect(url).toContain('fields=id,name,desc,url,closed');
    });

    test('sends memberCreator_fields in comment GET URL', async () => {
      mockFetchResponse({ body: [] });
      await api.getComments('c1');
      const url = getLastFetchUrl();
      expect(url).toContain('memberCreator_fields=id,fullName,username');
    });

    test('strips checklist checkItems to defined fields', async () => {
      mockFetchResponse({
        body: [
          {
            id: 'cl1',
            name: 'Checklist',
            idBoard: 'b1',
            idCard: 'c1',
            pos: 16384,
            checkItems: [
              {
                id: 'ci1',
                name: 'Item 1',
                state: 'complete',
                idChecklist: 'cl1',
                pos: 1,
                nameData: { emoji: {} },
                due: null,
                idMember: null,
              },
            ],
          },
        ],
      });
      const result = await api.getChecklists('c1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual([
        {
          id: 'cl1',
          name: 'Checklist',
          idBoard: 'b1',
          idCard: 'c1',
          checkItems: [
            {
              id: 'ci1',
              name: 'Item 1',
              state: 'complete',
              idChecklist: 'cl1',
              pos: 1,
            },
          ],
        },
      ]);
    });

    test('strips action memberCreator extra fields', async () => {
      mockFetchResponse({
        body: [
          {
            id: 'act1',
            type: 'updateCard',
            date: '2025-01-01',
            data: { listBefore: { id: 'l1' }, listAfter: { id: 'l2' } },
            memberCreator: {
              id: 'm1',
              fullName: 'Bob',
              username: 'bob',
              avatarHash: 'xyz',
              initials: 'B',
              activityBlocked: false,
            },
            limits: {},
          },
        ],
      });
      const result = await api.getBoardActivity('b1');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual([
        {
          id: 'act1',
          type: 'updateCard',
          date: '2025-01-01',
          data: { listBefore: { id: 'l1' }, listAfter: { id: 'l2' } },
          memberCreator: { id: 'm1', fullName: 'Bob', username: 'bob' },
        },
      ]);
    });

    test('strips checkAuth extra fields', async () => {
      mockFetchResponse({
        body: {
          id: 'm1',
          fullName: 'Test',
          username: 'test',
          avatarHash: 'abc',
          initials: 'T',
          email: 'test@example.com',
        },
      });
      const result = await api.checkAuth();
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        id: 'm1',
        fullName: 'Test',
        username: 'test',
      });
    });
  });
});
