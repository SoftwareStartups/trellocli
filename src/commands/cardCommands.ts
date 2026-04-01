import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class CardCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getCards(listId: string): Promise<void> {
    if (!listId) {
      print(fail('List ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getCardsInList(listId);
    print(result);
  }

  async getAllCards(boardId: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getCardsInBoard(boardId);
    print(result);
  }

  async getCard(cardId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getCard(cardId);
    print(result);
  }

  async createCard(
    listId: string,
    name: string,
    desc?: string,
    due?: string
  ): Promise<void> {
    if (!listId) {
      print(fail('List ID required', 'MISSING_PARAM'));
      return;
    }

    if (!name) {
      print(fail('Card name required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.createCard(listId, name, desc, due);
    print(result);
  }

  async updateCard(
    cardId: string,
    name?: string,
    desc?: string,
    due?: string,
    labels?: string,
    members?: string
  ): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.updateCard(
      cardId,
      name,
      desc,
      due,
      undefined,
      labels,
      members
    );
    print(result);
  }

  async moveCard(cardId: string, listId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!listId) {
      print(fail('List ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.moveCard(cardId, listId);
    print(result);
  }

  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.deleteCard(cardId);
    print(result);
  }

  async getComments(cardId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getComments(cardId);
    print(result);
  }

  async addComment(cardId: string, text: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!text) {
      print(fail('Comment text required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.addComment(cardId, text);
    print(result);
  }
}
