import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class MemberCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getBoardMembers(boardId: string): Promise<void> {
    if (!requireParam(boardId, 'Board ID')) return;

    const result = await this.api.getBoardMembers(boardId);
    print(result);
  }

  async assignMember(cardId: string, memberId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(memberId, 'Member ID')) return;

    const result = await this.api.assignMemberToCard(cardId, memberId);
    print(result);
  }

  async removeMember(cardId: string, memberId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(memberId, 'Member ID')) return;

    const result = await this.api.removeMemberFromCard(cardId, memberId);
    print(result);
  }
}
