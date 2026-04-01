import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ConfigService } from './configService.js';
import { type ApiResponse, success, fail } from '../models/apiResponse.js';
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
    due?: string,
    start?: string
  ): Promise<ApiResponse<Card>> {
    try {
      const url = this.buildUrl('/cards');
      const formData = new URLSearchParams();
      formData.append('idList', listId);
      formData.append('name', name);
      if (desc) formData.append('desc', desc);
      if (due) formData.append('due', due);
      if (start) formData.append('start', start);

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
    members?: string,
    start?: string,
    dueComplete?: string
  ): Promise<ApiResponse<Card>> {
    try {
      const formData = new URLSearchParams();
      if (name) formData.append('name', name);
      if (desc !== undefined) formData.append('desc', desc);
      if (due !== undefined) formData.append('due', due);
      if (listId) formData.append('idList', listId);
      if (labels !== undefined) formData.append('idLabels', labels);
      if (members !== undefined) formData.append('idMembers', members);
      if (start !== undefined) formData.append('start', start);
      if (dueComplete !== undefined)
        formData.append('dueComplete', dueComplete);

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

  // Archive operations
  async archiveCard(cardId: string): Promise<ApiResponse<Card>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}`);
      const formData = new URLSearchParams();
      formData.append('closed', 'true');
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

  async archiveList(listId: string): Promise<ApiResponse<TrelloList>> {
    try {
      const url = this.buildUrl(`/lists/${listId}/closed`);
      const formData = new URLSearchParams();
      formData.append('value', 'true');
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (response.status === 404) {
        return fail('List not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const list = (await response.json()) as TrelloList;
      return success(list);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Comment update/delete operations
  async updateComment(
    cardId: string,
    commentId: string,
    text: string
  ): Promise<ApiResponse<Comment>> {
    try {
      const url = this.buildUrl(
        `/cards/${cardId}/actions/${commentId}/comments`,
        `text=${encodeURIComponent(text)}`
      );
      const response = await fetch(url, { method: 'PUT' });
      if (response.status === 404) {
        return fail('Card or comment not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const comment = (await response.json()) as Comment;
      return success(comment);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async deleteComment(
    cardId: string,
    commentId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const url = this.buildUrl(
        `/cards/${cardId}/actions/${commentId}/comments`
      );
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Card or comment not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ deleted: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // My cards
  async getMyCards(): Promise<ApiResponse<Card[]>> {
    try {
      const url = this.buildUrl('/members/me/cards', 'filter=open');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cards = (await response.json()) as Card[];
      return success(cards);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Card history
  async getCardHistory(
    cardId: string,
    limit?: string
  ): Promise<ApiResponse<CardAction[]>> {
    try {
      const extra = limit ? `limit=${limit}` : undefined;
      const url = this.buildUrl(`/cards/${cardId}/actions`, extra);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const actions = (await response.json()) as CardAction[];
      return success(actions);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Board creation & activity
  async createBoard(
    name: string,
    desc?: string,
    workspaceId?: string
  ): Promise<ApiResponse<Board>> {
    try {
      const url = this.buildUrl('/boards');
      const formData = new URLSearchParams();
      formData.append('name', name);
      if (desc) formData.append('desc', desc);
      if (workspaceId) formData.append('idOrganization', workspaceId);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const board = (await response.json()) as Board;
      return success(board);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async getBoardActivity(
    boardId: string,
    limit?: string
  ): Promise<ApiResponse<CardAction[]>> {
    try {
      const extra = limit ? `limit=${limit}` : undefined;
      const url = this.buildUrl(`/boards/${boardId}/actions`, extra);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const actions = (await response.json()) as CardAction[];
      return success(actions);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Label operations
  async getBoardLabels(boardId: string): Promise<ApiResponse<Label[]>> {
    try {
      const url = this.buildUrl(`/boards/${boardId}/labels`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const labels = (await response.json()) as Label[];
      return success(labels);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async createLabel(
    boardId: string,
    name: string,
    color: string
  ): Promise<ApiResponse<Label>> {
    try {
      const url = this.buildUrl('/labels');
      const formData = new URLSearchParams();
      formData.append('name', name);
      formData.append('color', color);
      formData.append('idBoard', boardId);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const label = (await response.json()) as Label;
      return success(label);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async updateLabel(
    labelId: string,
    name?: string,
    color?: string
  ): Promise<ApiResponse<Label>> {
    try {
      const formData = new URLSearchParams();
      if (name) formData.append('name', name);
      if (color) formData.append('color', color);

      if (formData.toString() === '') {
        return fail('No update parameters provided', 'NO_PARAMS');
      }

      const url = this.buildUrl(`/labels/${labelId}`);
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (response.status === 404) {
        return fail('Label not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const label = (await response.json()) as Label;
      return success(label);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async deleteLabel(
    labelId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const url = this.buildUrl(`/labels/${labelId}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Label not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ deleted: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Member operations
  async getBoardMembers(boardId: string): Promise<ApiResponse<Member[]>> {
    try {
      const url = this.buildUrl(`/boards/${boardId}/members`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Board not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const members = (await response.json()) as Member[];
      return success(members);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async assignMemberToCard(
    cardId: string,
    memberId: string
  ): Promise<ApiResponse<Member[]>> {
    try {
      const url = this.buildUrl(
        `/cards/${cardId}/idMembers`,
        `value=${memberId}`
      );
      const response = await fetch(url, { method: 'POST' });
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const members = (await response.json()) as Member[];
      return success(members);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async removeMemberFromCard(
    cardId: string,
    memberId: string
  ): Promise<ApiResponse<{ removed: boolean }>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}/idMembers/${memberId}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Card or member not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ removed: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Workspace operations
  async getWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      const url = this.buildUrl('/members/me/organizations');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const workspaces = (await response.json()) as Workspace[];
      return success(workspaces);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async getWorkspaceBoards(workspaceId: string): Promise<ApiResponse<Board[]>> {
    try {
      const url = this.buildUrl(
        `/organizations/${workspaceId}/boards`,
        'filter=open'
      );
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Workspace not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const boards = (await response.json()) as Board[];
      return success(boards);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  // Checklist operations
  async getChecklists(cardId: string): Promise<ApiResponse<Checklist[]>> {
    try {
      const url = this.buildUrl(`/cards/${cardId}/checklists`);
      const response = await fetch(url);
      if (response.status === 404) {
        return fail('Card not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const checklists = (await response.json()) as Checklist[];
      return success(checklists);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async createChecklist(
    cardId: string,
    name: string
  ): Promise<ApiResponse<Checklist>> {
    try {
      const url = this.buildUrl('/checklists');
      const formData = new URLSearchParams();
      formData.append('idCard', cardId);
      formData.append('name', name);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const checklist = (await response.json()) as Checklist;
      return success(checklist);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async addCheckItem(
    checklistId: string,
    name: string
  ): Promise<ApiResponse<CheckItem>> {
    try {
      const url = this.buildUrl(
        `/checklists/${checklistId}/checkItems`,
        `name=${encodeURIComponent(name)}`
      );
      const response = await fetch(url, { method: 'POST' });
      if (response.status === 404) {
        return fail('Checklist not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const item = (await response.json()) as CheckItem;
      return success(item);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async updateCheckItem(
    cardId: string,
    checkItemId: string,
    name?: string,
    state?: string
  ): Promise<ApiResponse<CheckItem>> {
    try {
      const formData = new URLSearchParams();
      if (name) formData.append('name', name);
      if (state) formData.append('state', state);

      if (formData.toString() === '') {
        return fail('No update parameters provided', 'NO_PARAMS');
      }

      const url = this.buildUrl(`/cards/${cardId}/checkItem/${checkItemId}`);
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (response.status === 404) {
        return fail('Card or check item not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const item = (await response.json()) as CheckItem;
      return success(item);
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }

  async deleteChecklist(
    checklistId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const url = this.buildUrl(`/checklists/${checklistId}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 404) {
        return fail('Checklist not found', 'NOT_FOUND');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return success({ deleted: true });
    } catch (ex) {
      return fail((ex as Error).message, 'HTTP_ERROR');
    }
  }
}
