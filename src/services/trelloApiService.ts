import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ConfigService } from './configService.js';
import { type ApiResponse, success, fail } from '../models/apiResponse.js';
import type {
  Board,
  TrelloList,
  Card,
  Comment,
  Attachment,
  Member,
} from '../models/types.js';

const BASE_URL = 'https://api.trello.com/1';

export class TrelloApiService {
  private config: ConfigService;

  constructor(config: ConfigService) {
    this.config = config;
  }

  private buildUrl(endpoint: string, extraParams?: string): string {
    const sep = endpoint.includes('?') ? '&' : '?';
    let url = `${BASE_URL}${endpoint}${sep}${this.config.getAuthQuery()}`;
    if (extraParams) {
      url += `&${extraParams}`;
    }
    return url;
  }

  // Auth check
  async checkAuth(): Promise<ApiResponse<Member>> {
    try {
      const url = this.buildUrl('/members/me');
      const response = await fetch(url);
      if (!response.ok) {
        return fail('Invalid credentials', 'AUTH_ERROR');
      }
      const member = (await response.json()) as Member;
      return success(member);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Board operations
  async getBoards(): Promise<ApiResponse<Board[]>> {
    try {
      const url = this.buildUrl('/members/me/boards', 'filter=open');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const boards = (await response.json()) as Board[];
      return success(boards);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async getBoard(boardId: string): Promise<ApiResponse<Board>> {
    try {
      const url = this.buildUrl(`/boards/${boardId}`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const board = (await response.json()) as Board;
      return success(board);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // List operations
  async getLists(boardId: string): Promise<ApiResponse<TrelloList[]>> {
    try {
      const url = this.buildUrl(`/boards/${boardId}/lists`, 'filter=open');
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const lists = (await response.json()) as TrelloList[];
      return success(lists);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async createList(
    boardId: string,
    name: string
  ): Promise<ApiResponse<TrelloList>> {
    try {
      const url = this.buildUrl(
        '/lists',
        `name=${encodeURIComponent(name)}&idBoard=${boardId}`
      );
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const list = (await response.json()) as TrelloList;
      return success(list);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Card operations
  async getCardsInList(listId: string): Promise<ApiResponse<Card[]>> {
    try {
      const url = this.buildUrl(`/lists/${listId}/cards`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('List not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cards = (await response.json()) as Card[];
      return success(cards);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async getCardsInBoard(boardId: string): Promise<ApiResponse<Card[]>> {
    try {
      const url = this.buildUrl(`/boards/${boardId}/cards`, 'filter=open');
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cards = (await response.json()) as Card[];
      return success(cards);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async getCard(cardId: string): Promise<ApiResponse<Card>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const card = (await response.json()) as Card;
      return success(card);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async createCard(
    listId: string,
    name: string,
    desc?: string,
    due?: string
  ): Promise<ApiResponse<Card>> {
    try {
      const url = this.buildUrl('/cards');
      const formData = new URLSearchParams();
      formData.append('idList', listId);
      formData.append('name', name);
      if (desc) formData.append('desc', desc);
      if (due) formData.append('due', due);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const card = (await response.json()) as Card;
      return success(card);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async updateCard(
    cardId: string,
    name?: string,
    desc?: string,
    due?: string,
    listId?: string,
    labels?: string,
    members?: string
  ): Promise<ApiResponse<Card>> {
    try {
      const formData = new URLSearchParams();
      if (name) formData.append('name', name);
      if (desc !== undefined) formData.append('desc', desc);
      if (due !== undefined) formData.append('due', due);
      if (listId) formData.append('idList', listId);
      if (labels !== undefined) formData.append('idLabels', labels);
      if (members !== undefined) formData.append('idMembers', members);

      if (formData.toString() === '') {
        return fail('No update parameters provided', 'NO_PARAMS');
      }

      const url = this.buildUrl(`/cards/${cardId}`);
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const card = (await response.json()) as Card;
      return success(card);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async moveCard(cardId: string, listId: string): Promise<ApiResponse<Card>> {
    return this.updateCard(cardId, undefined, undefined, undefined, listId);
  }

  async deleteCard(cardId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ deleted: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Comment operations
  async getComments(cardId: string): Promise<ApiResponse<Comment[]>> {
    try {
      const url = this.buildUrl(
        `/cards/${cardId}/actions`,
        'filter=commentCard'
      );
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const comments = (await response.json()) as Comment[];
      return success(comments);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async addComment(
    cardId: string,
    text: string
  ): Promise<ApiResponse<Comment>> {
    try {
      const url = this.buildUrl(
        `/cards/${cardId}/actions/comments`,
        `text=${encodeURIComponent(text)}`
      );
      const response = await fetch(url, { method: 'POST' });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const comment = (await response.json()) as Comment;
      return success(comment);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Attachment operations
  async getAttachments(cardId: string): Promise<ApiResponse<Attachment[]>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}/attachments`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const attachments = (await response.json()) as Attachment[];
      return success(attachments);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async uploadAttachment(
    cardId: string,
    filePath: string,
    name?: string
  ): Promise<ApiResponse<Attachment>> {
    try {
      if (!fs.existsSync(filePath)) {
        return fail(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
      }

      const url = this.buildUrl(`/cards/${cardId}/attachments`);
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = name || path.basename(filePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer]), fileName);
      if (name) formData.append('name', name);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const attachment = (await response.json()) as Attachment;
      return success(attachment);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async attachUrl(
    cardId: string,
    attachUrl: string,
    name?: string
  ): Promise<ApiResponse<Attachment>> {
    try {
      const params = new URLSearchParams();
      params.append('url', attachUrl);
      if (name) params.append('name', name);

      const url = this.buildUrl(`/cards/${cardId}/attachments`);
      const response = await fetch(url, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const attachment = (await response.json()) as Attachment;
      return success(attachment);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async deleteAttachment(
    cardId: string,
    attachmentId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}/attachments/${attachmentId}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Attachment not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ deleted: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }
}
