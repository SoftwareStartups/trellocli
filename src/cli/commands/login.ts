import { sanitizeCredential, setSecret } from '../../auth/keychain.js';
import { TrelloApiService } from '../../services/trelloApiService.js';
import { CacheService } from '../../services/cacheService.js';
import { promptHidden } from '../../utils/prompt.js';

export interface LoginFlags {
  apiKey?: string;
  token?: string;
  skipValidation?: boolean;
}

export async function login(flags: LoginFlags): Promise<void> {
  const rawKey =
    flags.apiKey || (await promptHidden('Enter your Trello API key: '));
  let apiKey: string;
  try {
    apiKey = sanitizeCredential(rawKey);
  } catch (err: unknown) {
    console.error(
      `Error: ${err instanceof Error ? err.message : 'Invalid credential.'}`
    );
    process.exit(1);
  }

  const rawToken =
    flags.token || (await promptHidden('Enter your Trello token: '));
  let token: string;
  try {
    token = sanitizeCredential(rawToken);
  } catch (err: unknown) {
    console.error(
      `Error: ${err instanceof Error ? err.message : 'Invalid credential.'}`
    );
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

  try {
    await setSecret('TRELLO_API_KEY', apiKey);
    await setSecret('TRELLO_TOKEN', token);
  } catch {
    console.error(
      'Error: OS keychain not available. Set TRELLO_API_KEY and TRELLO_TOKEN environment variables instead.'
    );
    process.exit(1);
  }

  console.log('Credentials saved to OS keychain.');
}

async function validateCredentials(
  apiKey: string,
  token: string
): Promise<boolean> {
  try {
    const cache = new CacheService();
    cache.setEnabled(false);
    const api = new TrelloApiService(apiKey, token, cache);
    const result = await api.checkAuth();
    return result.ok;
  } catch {
    return false;
  }
}
