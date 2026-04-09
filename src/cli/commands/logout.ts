import { deleteSecret } from '../../auth/keychain.js';

export async function logout(): Promise<void> {
  const deletedKey = await deleteSecret('TRELLO_API_KEY');
  const deletedToken = await deleteSecret('TRELLO_TOKEN');

  if (!deletedKey && !deletedToken) {
    console.log('No stored credentials found. Already logged out.');
    return;
  }

  console.log('Credentials removed.');

  const envWarnings: string[] = [];
  if (process.env.TRELLO_API_KEY) envWarnings.push('TRELLO_API_KEY');
  if (process.env.TRELLO_TOKEN) envWarnings.push('TRELLO_TOKEN');
  if (envWarnings.length > 0) {
    console.log(
      `Note: ${envWarnings.join(' and ')} environment variable${envWarnings.length > 1 ? 's are' : ' is'} still set.`
    );
  }
}
