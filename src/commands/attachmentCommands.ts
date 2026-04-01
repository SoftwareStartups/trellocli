import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

export class AttachmentCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getAttachments(cardId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getAttachments(cardId);
    print(result);
  }

  async uploadAttachment(
    cardId: string,
    filePath: string,
    name?: string
  ): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!filePath) {
      print(fail('File path required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.uploadAttachment(cardId, filePath, name);
    print(result);
  }

  async attachUrl(cardId: string, url: string, name?: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!url) {
      print(fail('URL required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.attachUrl(cardId, url, name);
    print(result);
  }

  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    if (!cardId) {
      print(fail('Card ID required', 'MISSING_PARAM'));
      return;
    }

    if (!attachmentId) {
      print(fail('Attachment ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.deleteAttachment(cardId, attachmentId);
    print(result);
  }
}
