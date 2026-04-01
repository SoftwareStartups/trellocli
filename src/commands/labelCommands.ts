import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class LabelCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getBoardLabels(boardId: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;

    const result = await this.api.getBoardLabels(boardId);
    print(result);
  }

  async createLabel(
    boardId: string,
    name: string,
    color: string
  ): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;
    if (!requireParam(name, 'Label name')) return;
    if (!requireParam(color, 'Label color')) return;

    const result = await this.api.createLabel(boardId, name, color);
    print(result);
  }

  async updateLabel(
    labelId: string,
    name?: string,
    color?: string
  ): Promise<void> {
    if (!requireParam(labelId, 'Label ID')) return;

    const result = await this.api.updateLabel(labelId, name, color);
    print(result);
  }

  async deleteLabel(labelId: string): Promise<void> {
    if (!requireParam(labelId, 'Label ID')) return;

    const result = await this.api.deleteLabel(labelId);
    print(result);
  }
}
