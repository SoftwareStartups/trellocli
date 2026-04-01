import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class ChecklistCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getChecklists(cardId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getChecklists(cardId);
    print(result);
  }

  async createChecklist(cardId: string, name: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!name) {
      print(fail('Checklist name required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.createChecklist(cardId, name);
    print(result);
  }

  async addChecklistItem(checklistId: string, name: string): Promise<void> {
    if (!checklistId) {
      print(fail('Checklist ID required', 'MISSING_PARAM'));
      return;
    }

    if (!name) {
      print(fail('Item name required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.addCheckItem(checklistId, name);
    print(result);
  }

  async updateChecklistItem(
    cardId: string,
    checkItemId: string,
    name?: string,
    state?: string
  ): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!checkItemId) {
      print(fail('Check item ID required', 'MISSING_PARAM'));
      return;
    }

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
    if (!checklistId) {
      print(fail('Checklist ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.deleteChecklist(checklistId);
    print(result);
  }
}
