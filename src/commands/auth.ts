import { ConfigService } from '../services/configService.js';
import { TrelloApiService } from '../services/trelloApiService.js';
import { CacheService } from '../services/cacheService.js';
import { promptHidden } from '../utils/prompt.js';

export interface LoginFlags {
  apiKey?: string;
  token?: string;
  skipValidation?: boolean;
  configDir?: string;
}

export async function login(flags: LoginFlags): Promise<void> {
  const apiKey = (
    flags.apiKey || (await promptHidden('Enter your Trello API key: '))
  ).trim();
  if (!apiKey) {
    console.error('Error: API key cannot be empty.');
    process.exit(1);
  }

  const token = (
    flags.token || (await promptHidden('Enter your Trello token: '))
  ).trim();
  if (!token) {
    console.error('Error: Token cannot be empty.');
    process.exit(1);
  }

  if (!/^[0-9a-f]{32}$/i.test(apiKey)) {
    console.error(
      'Warning: API key does not match expected format (32-character hex string). Proceeding anyway.'
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(token)) {
    console.error(
      'Warning: Token does not match expected format (64-character hex string). Proceeding anyway.'
    );
  }

  if (!flags.skipValidation) {
    const valid = await validateCredentials(apiKey, token);
    if (!valid) {
      console.error(
        'Warning: Could not validate credentials. They may be invalid or the API may be unreachable.'
      );
      console.error('Storing credentials anyway.');
    }
  }

  const config = new ConfigService(flags.configDir);
  const { success, error } = config.saveAuth(apiKey, token);
  if (success) {
    console.log(`Credentials saved to ${config.configFile}`);
  } else {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

export async function logout(configDir?: string): Promise<void> {
  const config = new ConfigService(configDir);

  if (!config.hasConfigFile) {
    console.log('No stored credentials found. Already logged out.');
    return;
  }

  const { success, error } = config.clearAuth();
  if (success) {
    console.log('Credentials removed.');
  } else {
    console.error(`Error: ${error}`);
    process.exit(1);
  }

  const envWarnings: string[] = [];
  if (process.env.TRELLO_API_KEY) envWarnings.push('TRELLO_API_KEY');
  if (process.env.TRELLO_TOKEN) envWarnings.push('TRELLO_TOKEN');
  if (envWarnings.length > 0) {
    console.log(
      `Note: ${envWarnings.join(' and ')} environment variable${envWarnings.length > 1 ? 's are' : ' is'} still set.`
    );
  }
}

async function validateCredentials(
  apiKey: string,
  token: string
): Promise<boolean> {
  try {
    const config = new ConfigService();
    config.apiKey = apiKey;
    config.token = token;
    const cache = new CacheService();
    cache.setEnabled(false);
    const api = new TrelloApiService(config, cache);
    const result = await api.checkAuth();
    return result.ok;
  } catch {
    return false;
  }
}
