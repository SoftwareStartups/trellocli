import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class AttachmentCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getAttachments(cardId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;

    const result = await this.api.getAttachments(cardId);
    print(result);
  }

  async uploadAttachment(
    cardId: string,
    filePath: string,
    name?: string
  ): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(filePath, 'File path')) return;

    const result = await this.api.uploadAttachment(cardId, filePath, name);
    print(result);
  }

  async attachUrl(cardId: string, url: string, name?: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(url, 'URL')) return;

    const result = await this.api.attachUrl(cardId, url, name);
    print(result);
  }

  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    if (!requireParam(cardId, 'Card ID')) return;
    if (!requireParam(attachmentId, 'Attachment ID')) return;

    const result = await this.api.deleteAttachment(cardId, attachmentId);
    print(result);
  }
}
