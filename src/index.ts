#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConfigService } from './services/configService.js';
import { TrelloApiService } from './services/trelloApiService.js';
import { CacheService } from './services/cacheService.js';
import { success, fail } from './models/apiResponse.js';
import { print } from './utils/outputFormatter.js';
import { errorMessage } from './utils/errorUtils.js';
import { setVerbose } from './utils/logger.js';
import { setJsonMode } from './utils/outputFormatter.js';
import { COMMAND_MAP, parseArgs, generateHelp } from './commands/registry.js';

function readVersion(): string {
  try {
    const pkgPath = path.join(import.meta.dir, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return '1.1.0';
  }
}

const VERSION = readVersion();

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
  const config = new ConfigService();

  // Check for help/version first
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(generateHelp(VERSION));
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    console.log(`trellocli v${VERSION}`);
    return;
  }

  // Handle auth config commands (no validation needed)
  if (args[0] === '--set-auth') {
    const apiKey = args[1] ?? '';
    const token = args[2] ?? '';

    if (!apiKey || !token) {
      print(
        fail('Usage: trellocli --set-auth <api-key> <token>', 'MISSING_PARAM')
      );
      return;
    }

    const { success: ok, error } = config.saveAuth(apiKey, token);
    if (ok) {
      print(success({ message: 'Auth saved to ~/.trellocli/config.json' }));
    } else {
      print(fail(error ?? 'Unknown error', 'SAVE_ERROR'));
    }
    return;
  }

  if (args[0] === '--clear-auth') {
    const { success: ok, error } = config.clearAuth();
    if (ok) {
      print(success({ message: 'Auth cleared' }));
    } else {
      print(fail(error ?? 'Unknown error', 'CLEAR_ERROR'));
    }
    return;
  }

  // Validate auth for all other commands except check-auth
  if (args[0] !== '--check-auth') {
    const { valid, error } = config.validate();
    if (!valid) {
      print(fail(error ?? 'Auth not configured', 'AUTH_ERROR'));
      return;
    }
  }

  const cache = new CacheService();
  if (noCache) cache.setEnabled(false);
  const api = new TrelloApiService(config, cache);

  const cmd = COMMAND_MAP.get(args[0]);
  if (!cmd) {
    print(fail(`Unknown command: ${args[0]}`, 'UNKNOWN_COMMAND'));
    return;
  }

  try {
    const params = parseArgs(cmd, args);
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
