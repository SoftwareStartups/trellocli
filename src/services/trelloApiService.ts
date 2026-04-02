import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ConfigService } from './configService.js';
import { type ApiResponse, success, fail } from '../models/apiResponse.js';
import { errorMessage } from '../utils/errorUtils.js';
import { fetchWithResilience } from '../utils/httpClient.js';
import type { CacheService } from './cacheService.js';
import type {
  Board,
  TrelloList,
  Card,
  Comment,
  CardAction,
  Attachment,
  Member,
  Label,
  Workspace,
  Checklist,
  CheckItem,
} from '../models/types.js';

export interface UpdateCardOptions {
  name?: string;
  desc?: string;
  due?: string;
  listId?: string;
  labels?: string;
  members?: string;
  start?: string;
  dueComplete?: string;
}

const BASE_URL = 'https://api.trello.com/1';

// Cache TTLs in milliseconds
const TTL_LONG = 5 * 60 * 1000; // 5 min: boards, lists, labels, members, workspaces
const TTL_MED = 2 * 60 * 1000; // 2 min: cards, checklists
const TTL_SHORT = 30 * 1000; // 30 sec: actions, comments

export class TrelloApiService {
  private config: ConfigService;
  private cache?: CacheService;

  constructor(config: ConfigService, cache?: CacheService) {
    this.config = config;
    this.cache = cache;
  }

  private cachedRequest<T>(
    endpoint: string,
    ttlMs: number,
    options?: {
      extraParams?: string;
      notFoundMessage?: string;
    }
  ): Promise<ApiResponse<T>> {
    const cacheKey = `${endpoint}?${options?.extraParams ?? ''}`;
    const cached = this.cache?.get<ApiResponse<T>>(cacheKey);
    if (cached) return Promise.resolve(cached);

    const promise = this.request<T>(endpoint, options);
    promise.then((result) => {
      if (result.ok) this.cache?.set(cacheKey, result, ttlMs);
    });
    return promise;
  }

  private invalidateCache(...patterns: string[]): void {
    for (const p of patterns) {
      this.cache?.invalidate(p);
    }
  }

  private buildUrl(endpoint: string, extraParams?: string): string {
    const sep = endpoint.includes('?') ? '&' : '?';
    let url = `${BASE_URL}${endpoint}${sep}${this.config.getAuthQuery()}`;
    if (extraParams) {
      url += `&${extraParams}`;
    }
    return url;
  }

  private async request<T>(
    endpoint: string,
    options?: {
      method?: string;
      body?: URLSearchParams | FormData;
      extraParams?: string;
      notFoundMessage?: string;
      successValue?: T;
    }
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options?.extraParams);
      const fetchOpts: RequestInit = {};
      if (options?.method) fetchOpts.method = options.method;
      if (options?.body) {
        fetchOpts.body = options.body;
        if (options.body instanceof URLSearchParams) {
          fetchOpts.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
          };
        }
      }
      const response = await fetchWithResilience(url, fetchOpts);
      if (response.status === 404 && options?.notFoundMessage) {
        return fail(options.notFoundMessage, 'NOT_FOUND');
      }
      if (!response.ok) return fail(`HTTP ${response.status}`, 'HTTP_ERROR');
      if (options?.successValue !== undefined)
        return success(options.successValue);
      const data = (await response.json()) as T;
      return success(data);
    } catch (ex) {
      return fail(errorMessage(ex), 'HTTP_ERROR');
    }
  }

  // Auth check (special error handling — AUTH_ERROR instead of HTTP_ERROR)
  async checkAuth(): Promise<ApiResponse<Member>> {
    try {
      const url = this.buildUrl('/members/me');
      const response = await fetchWithResilience(url);
      if (!response.ok) {
        return fail('Invalid credentials', 'AUTH_ERROR');
      }
      const member = (await response.json()) as Member;
      return success(member);
    } catch (ex) {
      return fail(errorMessage(ex), 'HTTP_ERROR');
    }
  }

  // Board operations
  async getBoards(): Promise<ApiResponse<Board[]>> {
    return this.cachedRequest<Board[]>('/members/me/boards', TTL_LONG, {
      extraParams: 'filter=open',
    });
  }

  async getBoard(boardId: string): Promise<ApiResponse<Board>> {
    return this.cachedRequest<Board>(`/boards/${boardId}`, TTL_LONG, {
      notFoundMessage: 'Board not found',
    });
  }

  async createBoard(
    name: string,
    desc?: string,
    workspaceId?: string
  ): Promise<ApiResponse<Board>> {
    const formData = new URLSearchParams();
    formData.append('name', name);
    if (desc) formData.append('desc', desc);
    if (workspaceId) formData.append('idOrganization', workspaceId);
    this.invalidateCache('/members/me/boards');
    return this.request<Board>('/boards', { method: 'POST', body: formData });
  }

  async getBoardActivity(
    boardId: string,
    limit?: string
  ): Promise<ApiResponse<CardAction[]>> {
    return this.cachedRequest<CardAction[]>(
      `/boards/${boardId}/actions`,
      TTL_SHORT,
      {
        extraParams: limit ? `limit=${limit}` : undefined,
        notFoundMessage: 'Board not found',
      }
    );
  }

  // List operations
  async getLists(boardId: string): Promise<ApiResponse<TrelloList[]>> {
    return this.cachedRequest<TrelloList[]>(
      `/boards/${boardId}/lists`,
      TTL_LONG,
      {
        extraParams: 'filter=open',
        notFoundMessage: 'Board not found',
      }
    );
  }

  async createList(
    boardId: string,
    name: string
  ): Promise<ApiResponse<TrelloList>> {
    this.invalidateCache(`/boards/${boardId}/lists`);
    return this.request<TrelloList>('/lists', {
      method: 'POST',
      extraParams: `name=${encodeURIComponent(name)}&idBoard=${boardId}`,
    });
  }

  async archiveList(listId: string): Promise<ApiResponse<TrelloList>> {
    this.invalidateCache('/lists/', '/boards/');
    const formData = new URLSearchParams();
    formData.append('value', 'true');
    return this.request<TrelloList>(`/lists/${listId}/closed`, {
      method: 'PUT',
      body: formData,
      notFoundMessage: 'List not found',
    });
  }

  // Card operations
  async getCardsInList(listId: string): Promise<ApiResponse<Card[]>> {
    return this.cachedRequest<Card[]>(`/lists/${listId}/cards`, TTL_MED, {
      notFoundMessage: 'List not found',
    });
  }

  async getCardsInBoard(boardId: string): Promise<ApiResponse<Card[]>> {
    return this.cachedRequest<Card[]>(`/boards/${boardId}/cards`, TTL_MED, {
      extraParams: 'filter=open',
      notFoundMessage: 'Board not found',
    });
  }

  async getCard(cardId: string): Promise<ApiResponse<Card>> {
    return this.cachedRequest<Card>(`/cards/${cardId}`, TTL_MED, {
      notFoundMessage: 'Card not found',
    });
  }

  async createCard(
    listId: string,
    name: string,
    desc?: string,
    due?: string,
    start?: string
  ): Promise<ApiResponse<Card>> {
    const formData = new URLSearchParams();
    formData.append('idList', listId);
    formData.append('name', name);
    if (desc) formData.append('desc', desc);
    if (due) formData.append('due', due);
    if (start) formData.append('start', start);
    this.invalidateCache('/cards', '/lists/');
    return this.request<Card>('/cards', { method: 'POST', body: formData });
  }

  async updateCard(
    cardId: string,
    options: UpdateCardOptions
  ): Promise<ApiResponse<Card>> {
    const formData = new URLSearchParams();
    if (options.name) formData.append('name', options.name);
    if (options.desc !== undefined) formData.append('desc', options.desc);
    if (options.due !== undefined) formData.append('due', options.due);
    if (options.listId) formData.append('idList', options.listId);
    if (options.labels !== undefined)
      formData.append('idLabels', options.labels);
    if (options.members !== undefined)
      formData.append('idMembers', options.members);
    if (options.start !== undefined) formData.append('start', options.start);
    if (options.dueComplete !== undefined)
      formData.append('dueComplete', options.dueComplete);

    if (formData.toString() === '') {
      return fail('No update parameters provided', 'NO_PARAMS');
    }

    this.invalidateCache(`/cards/${cardId}`, '/lists/', '/boards/');
    return this.request<Card>(`/cards/${cardId}`, {
      method: 'PUT',
      body: formData,
      notFoundMessage: 'Card not found',
    });
  }

  async moveCard(cardId: string, listId: string): Promise<ApiResponse<Card>> {
    return this.updateCard(cardId, { listId });
  }

  async archiveCard(cardId: string): Promise<ApiResponse<Card>> {
    this.invalidateCache(`/cards/${cardId}`, '/lists/', '/boards/');
    const formData = new URLSearchParams();
    formData.append('closed', 'true');
    return this.request<Card>(`/cards/${cardId}`, {
      method: 'PUT',
      body: formData,
      notFoundMessage: 'Card not found',
    });
  }

  async deleteCard(cardId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    this.invalidateCache(`/cards/${cardId}`, '/lists/', '/boards/');
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE',
      notFoundMessage: 'Card not found',
      successValue: { deleted: true },
    });
  }

  // Comment operations
  async getComments(cardId: string): Promise<ApiResponse<Comment[]>> {
    return this.cachedRequest<Comment[]>(
      `/cards/${cardId}/actions`,
      TTL_SHORT,
      {
        extraParams: 'filter=commentCard',
        notFoundMessage: 'Card not found',
      }
    );
  }

  async addComment(
    cardId: string,
    text: string
  ): Promise<ApiResponse<Comment>> {
    this.invalidateCache(`/cards/${cardId}/actions`);
    return this.request<Comment>(`/cards/${cardId}/actions/comments`, {
      method: 'POST',
      extraParams: `text=${encodeURIComponent(text)}`,
      notFoundMessage: 'Card not found',
    });
  }

  async updateComment(
    cardId: string,
    commentId: string,
    text: string
  ): Promise<ApiResponse<Comment>> {
    this.invalidateCache(`/cards/${cardId}/actions`);
    return this.request<Comment>(
      `/cards/${cardId}/actions/${commentId}/comments`,
      {
        method: 'PUT',
        extraParams: `text=${encodeURIComponent(text)}`,
        notFoundMessage: 'Card or comment not found',
      }
    );
  }

  async deleteComment(
    cardId: string,
    commentId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    this.invalidateCache(`/cards/${cardId}/actions`);
    return this.request(`/cards/${cardId}/actions/${commentId}/comments`, {
      method: 'DELETE',
      notFoundMessage: 'Card or comment not found',
      successValue: { deleted: true },
    });
  }

  // Attachment operations
  async getAttachments(cardId: string): Promise<ApiResponse<Attachment[]>> {
    return this.cachedRequest<Attachment[]>(
      `/cards/${cardId}/attachments`,
      TTL_MED,
      { notFoundMessage: 'Card not found' }
    );
  }

  async uploadAttachment(
    cardId: string,
    filePath: string,
    name?: string
  ): Promise<ApiResponse<Attachment>> {
    this.invalidateCache(`/cards/${cardId}/attachments`);
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
    } catch (ex) {
      return fail(
        `Cannot read file ${filePath}: ${errorMessage(ex)}`,
        'FILE_ERROR'
      );
    }

    const fileName = name || path.basename(filePath);
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);
    if (name) formData.append('name', name);

    return this.request<Attachment>(`/cards/${cardId}/attachments`, {
      method: 'POST',
      body: formData,
      notFoundMessage: 'Card not found',
    });
  }

  async attachUrl(
    cardId: string,
    attachUrl: string,
    name?: string
  ): Promise<ApiResponse<Attachment>> {
    this.invalidateCache(`/cards/${cardId}/attachments`);
    const params = new URLSearchParams();
    params.append('url', attachUrl);
    if (name) params.append('name', name);
    return this.request<Attachment>(`/cards/${cardId}/attachments`, {
      method: 'POST',
      body: params,
      notFoundMessage: 'Card not found',
    });
  }

  async deleteAttachment(
    cardId: string,
    attachmentId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    this.invalidateCache(`/cards/${cardId}/attachments`);
    return this.request(`/cards/${cardId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      notFoundMessage: 'Attachment not found',
      successValue: { deleted: true },
    });
  }

  // Copy card
  async copyCard(
    cardId: string,
    targetListId: string,
    keepFromSource: string = 'all'
  ): Promise<ApiResponse<Card>> {
    this.invalidateCache('/cards', '/lists/');
    const formData = new URLSearchParams();
    formData.append('idList', targetListId);
    formData.append('idCardSource', cardId);
    formData.append('keepFromSource', keepFromSource);
    return this.request<Card>('/cards', { method: 'POST', body: formData });
  }

  // My cards
  async getMyCards(): Promise<ApiResponse<Card[]>> {
    return this.cachedRequest<Card[]>('/members/me/cards', TTL_MED, {
      extraParams: 'filter=open',
    });
  }

  // Card history
  async getCardHistory(
    cardId: string,
    limit?: string
  ): Promise<ApiResponse<CardAction[]>> {
    return this.cachedRequest<CardAction[]>(
      `/cards/${cardId}/actions`,
      TTL_SHORT,
      {
        extraParams: limit ? `limit=${limit}` : undefined,
        notFoundMessage: 'Card not found',
      }
    );
  }

  // Label operations
  async getBoardLabels(boardId: string): Promise<ApiResponse<Label[]>> {
    return this.cachedRequest<Label[]>(`/boards/${boardId}/labels`, TTL_LONG, {
      notFoundMessage: 'Board not found',
    });
  }

  async createLabel(
    boardId: string,
    name: string,
    color: string
  ): Promise<ApiResponse<Label>> {
    this.invalidateCache(`/boards/${boardId}/labels`);
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('color', color);
    formData.append('idBoard', boardId);
    return this.request<Label>('/labels', { method: 'POST', body: formData });
  }

  async updateLabel(
    labelId: string,
    name?: string,
    color?: string
  ): Promise<ApiResponse<Label>> {
    const formData = new URLSearchParams();
    if (name) formData.append('name', name);
    if (color) formData.append('color', color);

    if (formData.toString() === '') {
      return fail('No update parameters provided', 'NO_PARAMS');
    }

    this.invalidateCache('/labels');
    return this.request<Label>(`/labels/${labelId}`, {
      method: 'PUT',
      body: formData,
      notFoundMessage: 'Label not found',
    });
  }

  async deleteLabel(
    labelId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    this.invalidateCache('/labels');
    return this.request(`/labels/${labelId}`, {
      method: 'DELETE',
      notFoundMessage: 'Label not found',
      successValue: { deleted: true },
    });
  }

  // Member operations
  async getBoardMembers(boardId: string): Promise<ApiResponse<Member[]>> {
    return this.cachedRequest<Member[]>(
      `/boards/${boardId}/members`,
      TTL_LONG,
      { notFoundMessage: 'Board not found' }
    );
  }

  async assignMemberToCard(
    cardId: string,
    memberId: string
  ): Promise<ApiResponse<Member[]>> {
    this.invalidateCache(`/cards/${cardId}`);
    return this.request<Member[]>(`/cards/${cardId}/idMembers`, {
      method: 'POST',
      extraParams: `value=${memberId}`,
      notFoundMessage: 'Card not found',
    });
  }

  async removeMemberFromCard(
    cardId: string,
    memberId: string
  ): Promise<ApiResponse<{ removed: boolean }>> {
    this.invalidateCache(`/cards/${cardId}`);
    return this.request(`/cards/${cardId}/idMembers/${memberId}`, {
      method: 'DELETE',
      notFoundMessage: 'Card or member not found',
      successValue: { removed: true },
    });
  }

  // Workspace operations
  async getWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    return this.cachedRequest<Workspace[]>(
      '/members/me/organizations',
      TTL_LONG
    );
  }

  async getWorkspaceBoards(workspaceId: string): Promise<ApiResponse<Board[]>> {
    return this.cachedRequest<Board[]>(
      `/organizations/${workspaceId}/boards`,
      TTL_LONG,
      {
        extraParams: 'filter=open',
        notFoundMessage: 'Workspace not found',
      }
    );
  }

  // Checklist operations
  async getChecklists(cardId: string): Promise<ApiResponse<Checklist[]>> {
    return this.cachedRequest<Checklist[]>(
      `/cards/${cardId}/checklists`,
      TTL_MED,
      { notFoundMessage: 'Card not found' }
    );
  }

  async createChecklist(
    cardId: string,
    name: string
  ): Promise<ApiResponse<Checklist>> {
    this.invalidateCache(`/cards/${cardId}/checklists`);
    const formData = new URLSearchParams();
    formData.append('idCard', cardId);
    formData.append('name', name);
    return this.request<Checklist>('/checklists', {
      method: 'POST',
      body: formData,
    });
  }

  async addCheckItem(
    checklistId: string,
    name: string
  ): Promise<ApiResponse<CheckItem>> {
    this.invalidateCache('/checklists');
    return this.request<CheckItem>(`/checklists/${checklistId}/checkItems`, {
      method: 'POST',
      extraParams: `name=${encodeURIComponent(name)}`,
      notFoundMessage: 'Checklist not found',
    });
  }

  async updateCheckItem(
    cardId: string,
    checkItemId: string,
    name?: string,
    state?: string
  ): Promise<ApiResponse<CheckItem>> {
    const formData = new URLSearchParams();
    if (name) formData.append('name', name);
    if (state) formData.append('state', state);

    if (formData.toString() === '') {
      return fail('No update parameters provided', 'NO_PARAMS');
    }

    this.invalidateCache('/checklists', `/cards/${cardId}`);
    return this.request<CheckItem>(
      `/cards/${cardId}/checkItem/${checkItemId}`,
      {
        method: 'PUT',
        body: formData,
        notFoundMessage: 'Card or check item not found',
      }
    );
  }

  async deleteChecklist(
    checklistId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    this.invalidateCache('/checklists');
    return this.request(`/checklists/${checklistId}`, {
      method: 'DELETE',
      notFoundMessage: 'Checklist not found',
      successValue: { deleted: true },
    });
  }
}
