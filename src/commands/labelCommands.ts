import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class LabelCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getBoardLabels(boardId: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getBoardLabels(boardId);
    print(result);
  }

  async createLabel(
    boardId: string,
    name: string,
    color: string
  ): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    if (!name) {
      print(fail('Label name required', 'MISSING_PARAM'));
      return;
    }

    if (!color) {
      print(fail('Label color required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.createLabel(boardId, name, color);
    print(result);
  }

  async updateLabel(
    labelId: string,
    name?: string,
    color?: string
  ): Promise<void> {
    if (!labelId) {
      print(fail('Label ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.updateLabel(labelId, name, color);
    print(result);
  }

  async deleteLabel(labelId: string): Promise<void> {
    if (!labelId) {
      print(fail('Label ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.deleteLabel(labelId);
    print(result);
  }
}
