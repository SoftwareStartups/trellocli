import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam, validateTrelloId } from '../utils/paramValidation.js';

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
    if (!requireParam(boardId, 'Board ID')) return;
    if (!validateTrelloId(boardId, 'Board ID')) return;

    const result = await this.api.getBoard(boardId);
    print(result);
  }

  async createBoard(
    name: string,
    desc?: string,
    workspaceId?: string
  ): Promise<void> {
    if (!requireParam(name, 'Board name')) return;

    const result = await this.api.createBoard(name, desc, workspaceId);
    print(result);
  }

  async getBoardActivity(boardId: string, limit?: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;
    if (!validateTrelloId(boardId, 'Board ID')) return;

    const result = await this.api.getBoardActivity(boardId, limit);
    print(result);
  }
}
