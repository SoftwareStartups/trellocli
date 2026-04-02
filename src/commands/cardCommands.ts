import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import {
  requireParam,
  validateDate,
  validateTrelloId,
} from '../utils/paramValidation.js';

export class CardCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getCards(listId: string): Promise<void> {
    if (!requireParam(listId, 'List ID')) return;
    if (!validateTrelloId(listId, 'List ID')) return;

    const result = await this.api.getCardsInList(listId);
    print(result);
  }

  async getAllCards(boardId: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;
    if (!validateTrelloId(boardId, 'Board ID')) return;

    const result = await this.api.getCardsInBoard(boardId);
    print(result);
  }

  async getCard(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;

    const result = await this.api.getCard(cardId);
    print(result);
  }

  async createCard(
    listId: string,
    name: string,
    desc?: string,
    due?: string,
    start?: string
  ): Promise<void> {
    if (!requireParam(listId, 'List ID')) return;
    if (!validateTrelloId(listId, 'List ID')) return;
    if (!requireParam(name, 'Card name')) return;
    if (due && !validateDate(due, 'Due date')) return;
    if (start && !validateDate(start, 'Start date')) return;

    const result = await this.api.createCard(listId, name, desc, due, start);
    print(result);
  }

  async updateCard(
    cardId: string,
    name?: string,
    desc?: string,
    due?: string,
    labels?: string,
    members?: string,
    start?: string,
    dueComplete?: string
  ): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (due && !validateDate(due, 'Due date')) return;
    if (start && !validateDate(start, 'Start date')) return;

    const result = await this.api.updateCard(cardId, {
      name,
      desc,
      due,
      labels,
      members,
      start,
      dueComplete,
    });
    print(result);
  }

  async moveCard(cardId: string, listId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (!requireParam(listId, 'List ID')) return;
    if (!validateTrelloId(listId, 'List ID')) return;

    const result = await this.api.moveCard(cardId, listId);
    print(result);
  }

  async deleteCard(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;

    const result = await this.api.deleteCard(cardId);
    print(result);
  }

  async getComments(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;

    const result = await this.api.getComments(cardId);
    print(result);
  }

  async addComment(cardId: string, text: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (!requireParam(text, 'Comment text')) return;

    const result = await this.api.addComment(cardId, text);
    print(result);
  }

  async archiveCard(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;

    const result = await this.api.archiveCard(cardId);
    print(result);
  }

  async updateComment(
    cardId: string,
    commentId: string,
    text: string
  ): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (!requireParam(commentId, 'Comment ID')) return;
    if (!requireParam(text, 'Comment text')) return;

    const result = await this.api.updateComment(cardId, commentId, text);
    print(result);
  }

  async deleteComment(cardId: string, commentId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (!requireParam(commentId, 'Comment ID')) return;

    const result = await this.api.deleteComment(cardId, commentId);
    print(result);
  }

  async copyCard(
    cardId: string,
    targetListId: string,
    keep?: string
  ): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;
    if (!requireParam(targetListId, 'Target list ID')) return;
    if (!validateTrelloId(targetListId, 'Target list ID')) return;

    const result = await this.api.copyCard(cardId, targetListId, keep || 'all');
    print(result);
  }

  async getMyCards(): Promise<void> {
    const result = await this.api.getMyCards();
    print(result);
  }

  async getCardHistory(cardId: string, limit?: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!validateTrelloId(cardId, 'Card ID')) return;

    const result = await this.api.getCardHistory(cardId, limit);
    print(result);
  }
}
