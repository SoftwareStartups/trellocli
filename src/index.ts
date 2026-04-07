#!/usr/bin/env bun

import packageJson from '../package.json' with { type: 'json' };
import { ConfigService } from './services/configService.js';
import { TrelloApiService } from './services/trelloApiService.js';
import { CacheService } from './services/cacheService.js';
import { fail } from './models/apiResponse.js';
import { print } from './utils/outputFormatter.js';
import { errorMessage } from './utils/errorUtils.js';
import { setVerbose } from './utils/logger.js';
import { setJsonMode } from './utils/outputFormatter.js';
import {
  getCommand,
  getGroup,
  parseArgs,
  generateTopHelp,
  generateNounHelp,
  generateCommandHelp,
} from './commands/registry.js';

const VERSION = packageJson.version;

function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  // Parse global flags before command dispatch
  const isVerbose =
    rawArgs.includes('--verbose') ||
    rawArgs.includes('--debug') ||
    process.env.TRELLO_DEBUG === '1';
  setVerbose(isVerbose);
  setJsonMode(rawArgs.includes('--json'));

  const noCache = rawArgs.includes('--no-cache');

  const args = rawArgs.filter(
    (a) =>
      a !== '--verbose' &&
      a !== '--debug' &&
      a !== '--json' &&
      a !== '--no-cache'
  );

  // Top-level help or no args
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(generateTopHelp(VERSION));
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    console.log(`trellocli v${VERSION}`);
    return;
  }

  // Top-level commands (not noun-verb)
  if (args[0] === 'login') {
    const { login } = await import('./commands/auth.js');
    await login({
      apiKey: getFlagValue(args, '--api-key'),
      token: getFlagValue(args, '--token'),
      skipValidation: args.includes('--skip-validation'),
    });
    return;
  }

  if (args[0] === 'logout') {
    const { logout } = await import('./commands/auth.js');
    await logout();
    return;
  }

  const noun = args[0];
  const verb = args[1];

  // Noun-level help: `trellocli boards` or `trellocli boards --help`
  if (!verb || verb === '--help' || verb === '-h') {
    const group = getGroup(noun);
    if (!group) {
      print(fail(`Unknown command: ${noun}`, 'UNKNOWN_COMMAND'));
      return;
    }
    console.log(generateNounHelp(noun, VERSION));
    return;
  }

  // Command-level help: `trellocli boards get --help`
  if (args.includes('--help') || args.includes('-h')) {
    console.log(generateCommandHelp(noun, verb));
    return;
  }

  const cmd = getCommand(noun, verb);
  if (!cmd) {
    if (getGroup(noun)) {
      print(fail(`Unknown subcommand: ${noun} ${verb}`, 'UNKNOWN_COMMAND'));
    } else {
      print(fail(`Unknown command: ${noun}`, 'UNKNOWN_COMMAND'));
    }
    return;
  }

  // Auth validation: skip for auth commands (auth status handles it itself)
  const config = new ConfigService();
  if (noun !== 'auth') {
    const { valid, error } = config.validate();
    if (!valid) {
      print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
      return;
    }
  }

  const cache = new CacheService();
  if (noCache) cache.setEnabled(false);
  const api = new TrelloApiService(config, cache);

  try {
    const cmdArgs = args.slice(2); // strip noun + verb
    const params = parseArgs(cmd, cmdArgs);
    await cmd.execute(api, config, params);
  } catch (ex) {
    print(fail(errorMessage(ex), 'ERROR'));
  }
}

main().catch((ex: unknown) => {
  console.error(
    JSON.stringify({ ok: false, error: errorMessage(ex), code: 'FATAL' })
  );
  process.exit(1);
});
