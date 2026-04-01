import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class MemberCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getBoardMembers(boardId: string): Promise<void> {
    if (!boardId) {
      print(fail('Board ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getBoardMembers(boardId);
    print(result);
  }

  async assignMember(cardId: string, memberId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!memberId) {
      print(fail('Member ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.assignMemberToCard(cardId, memberId);
    print(result);
  }

  async removeMember(cardId: string, memberId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!memberId) {
      print(fail('Member ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.removeMemberFromCard(cardId, memberId);
    print(result);
  }
}
