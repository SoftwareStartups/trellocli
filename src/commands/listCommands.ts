import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class ListCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getLists(boardId: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getLists(boardId);
    print(result);
  }

  async createList(boardId: string, name: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    if (!name) {
      print(fail('List name required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.createList(boardId, name);
    print(result);
  }

  async archiveList(listId: string): Promise<void> {
    if (!listId) {
      print(fail('List ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.archiveList(listId);
    print(result);
  }
}
