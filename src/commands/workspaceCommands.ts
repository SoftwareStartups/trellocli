import type { TrelloApiService } from '../services/trelloApiService.js';
import { fail } from '../models/apiResponse.js';
import { print } from '../utils/outputFormatter.js';

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
    if (!workspaceId) {
      print(fail('Workspace ID required', 'MISSING_PARAM'));
      return;
    }

    const result = await this.api.getWorkspaceBoards(workspaceId);
    print(result);
  }
}
