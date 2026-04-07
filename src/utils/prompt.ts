import * as readline from 'node:readline';
import { Writable } from 'node:stream';

export function isTTY(): boolean {
  return !!process.stdin.isTTY;
}

export function promptHidden(label: string): Promise<string> {
  if (!isTTY()) {
    console.error(
      'No TTY detected. Use --api-key and --token flags for non-interactive use.'
    );
    process.exit(1);
  }

  const mutableOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableOutput,
    terminal: true,
  });

  return new Promise<string>((resolve) => {
    process.stdout.write(label);
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}
