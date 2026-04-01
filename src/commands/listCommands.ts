import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class ListCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getLists(boardId: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;

    const result = await this.api.getLists(boardId);
    print(result);
  }

  async createList(boardId: string, name: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;
    if (!requireParam(name, 'List name')) return;

    const result = await this.api.createList(boardId, name);
    print(result);
  }

  async archiveList(listId: string): Promise<void> {
    if (!requireParam(listId, 'List ID')) return;

    const result = await this.api.archiveList(listId);
    print(result);
  }
}
