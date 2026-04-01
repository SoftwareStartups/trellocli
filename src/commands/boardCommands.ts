import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class BoardCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getBoards(): Promise<void> {
    const result = await this.api.getBoards();
    print(result);
  }

  async getBoard(boardId: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getBoard(boardId);
    print(result);
  }
}
