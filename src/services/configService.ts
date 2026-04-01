import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

interface ConfigData {
  apiKey?: string;
  token?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.trello-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigService {
  public apiKey: string | undefined;
  public token: string | undefined;

  constructor() {
    // Priority: Environment variables > Config file
    this.apiKey = process.env.TRELLO_API_KEY;
    this.token = process.env.TRELLO_TOKEN;

    // If not in env, try config file
    if (!this.apiKey || !this.token) {
      this.loadFromFile();
    }
  }

  get isConfigured(): boolean {
    return !!this.apiKey && !!this.token;
  }

  private loadFromFile(): void {
    if (!fs.existsSync(CONFIG_FILE)) return;

    try {
      const json = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config: ConfigData = JSON.parse(json);
      if (config) {
        this.apiKey = this.apiKey ?? config.apiKey;
        this.token = this.token ?? config.token;
      }
    } catch {
      // Ignore file read errors
    }
  }

  static saveAuth(
    apiKey: string,
    token: string
  ): { success: boolean; error?: string } {
    try {
      if (!apiKey?.trim()) {
        return { success: false, error: 'API Key cannot be empty' };
      }
      if (!token?.trim()) {
        return { success: false, error: 'Token cannot be empty' };
      }

      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      const config: ConfigData = { apiKey, token };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config));

      return { success: true };
    } catch (ex) {
      return { success: false, error: (ex as Error).message };
    }
  }

  static clearAuth(): { success: boolean; error?: string } {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      return { success: true };
    } catch (ex) {
      return { success: false, error: (ex as Error).message };
    }
  }

  getAuthQuery(): string {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  validate(): { valid: boolean; error?: string } {
    if (!this.apiKey) {
      return {
        valid: false,
        error: 'API Key not set. Use: trello-cli --set-auth <api-key> <token>',
      };
    }

    if (!this.token) {
      return {
        valid: false,
        error: 'Token not set. Use: trello-cli --set-auth <api-key> <token>',
      };
    }

    return { valid: true };
  }
}
