import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class ChecklistCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getChecklists(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;

    const result = await this.api.getChecklists(cardId);
    print(result);
  }

  async createChecklist(cardId: string, name: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(name, 'Checklist name')) return;

    const result = await this.api.createChecklist(cardId, name);
    print(result);
  }

  async addChecklistItem(checklistId: string, name: string): Promise<void> {
    if (!requireParam(checklistId, 'Checklist ID')) return;
    if (!requireParam(name, 'Item name')) return;

    const result = await this.api.addCheckItem(checklistId, name);
    print(result);
  }

  async updateChecklistItem(
    cardId: string,
    checkItemId: string,
    name?: string,
    state?: string
  ): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(checkItemId, 'Check item ID')) return;

    if (state && state !== 'complete' && state !== 'incomplete') {
      print(fail('State must be "complete" or "incomplete"', 'INVALID_PARAM'));
      return;
    }

    const result = await this.api.updateCheckItem(
      cardId,
      checkItemId,
      name,
      state
    );
    print(result);
  }

  async deleteChecklist(checklistId: string): Promise<void> {
    if (!requireParam(checklistId, 'Checklist ID')) return;

    const result = await this.api.deleteChecklist(checklistId);
    print(result);
  }
}
