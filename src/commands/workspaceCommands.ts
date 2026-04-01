import type { TrelloApiService } from '../services/trelloApiService.js';
import { print } from '../utils/outputFormatter.js';
import { requireParam } from '../utils/paramValidation.js';

export class WorkspaceCommands {
  private api: TrelloApiService;

  constructor(api: TrelloApiService) {
    this.api = api;
  }

  async getWorkspaces(): Promise<void> {
    const result = await this.api.getWorkspaces();
    print(result);
  }

  async getWorkspaceBoards(workspaceId: string): Promise<void> {
    if (!requireParam(workspaceId, 'Workspace ID')) return;

    const result = await this.api.getWorkspaceBoards(workspaceId);
    print(result);
  }
}
