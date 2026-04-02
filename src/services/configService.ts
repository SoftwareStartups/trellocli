import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { errorMessage } from '../utils/errorUtils.js';

interface ConfigData {
  apiKey?: string;
  token?: string;
}

interface EncryptedConfig {
  encrypted: true;
  data: string; // base64
  iv: string; // base64
  salt: string; // base64
}

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.trellocli');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function deriveKey(salt: Buffer): Buffer {
  const machineSecret = `${os.hostname()}:${os.userInfo().uid}:trellocli`;
  return crypto.scryptSync(machineSecret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string): EncryptedConfig {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return {
    encrypted: true,
    data: `${encrypted}:${authTag.toString('base64')}`,
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
  };
}

function decrypt(config: EncryptedConfig): string {
  const salt = Buffer.from(config.salt, 'base64');
  const key = deriveKey(salt);
  const iv = Buffer.from(config.iv, 'base64');
  const [encData, authTagB64] = config.data.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  let decrypted = decipher.update(encData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class ConfigService {
  public apiKey: string | undefined;
  public token: string | undefined;
  private configDir: string;
  private configFile: string;

  constructor(configDir?: string) {
    this.configDir = configDir ?? DEFAULT_CONFIG_DIR;
    this.configFile = path.join(this.configDir, 'config.json');

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
    if (!fs.existsSync(this.configFile)) return;

    try {
      const json = fs.readFileSync(this.configFile, 'utf-8');
      const raw = JSON.parse(json);

      let config: ConfigData;
      if (raw.encrypted) {
        const decrypted = decrypt(raw as EncryptedConfig);
        config = JSON.parse(decrypted);
      } else {
        config = raw as ConfigData;
      }

      if (config) {
        this.apiKey = this.apiKey ?? config.apiKey;
        this.token = this.token ?? config.token;
      }
    } catch {
      // Ignore file read/decrypt errors (machine changed, corrupt file)
    }
  }

  saveAuth(
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

      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
      }

      const config: ConfigData = { apiKey, token };
      const encrypted = encrypt(JSON.stringify(config));
      fs.writeFileSync(this.configFile, JSON.stringify(encrypted), {
        mode: 0o600,
      });

      return { success: true };
    } catch (ex) {
      return { success: false, error: errorMessage(ex) };
    }
  }

  clearAuth(): { success: boolean; error?: string } {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
      return { success: true };
    } catch (ex) {
      return { success: false, error: errorMessage(ex) };
    }
  }

  getAuthQuery(): string {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  validate(): { valid: boolean; error?: string } {
    if (!this.apiKey) {
      return {
        valid: false,
        error: 'API Key not set. Use: trellocli auth set <api-key> <token>',
      };
    }

    if (!this.token) {
      return {
        valid: false,
        error: 'Token not set. Use: trellocli auth set <api-key> <token>',
      };
    }

    return { valid: true };
  }
}
