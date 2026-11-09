// Minimal stdin prompt helpers (username visible, password masked).
import readline from 'node:readline';

export function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

export function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    const onData = (char) => {
      const s = char.toString('utf8');
      if (s === '\n' || s === '\r' || s === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(buf);
      } else if (s === '\u0003') { // Ctrl+C
        process.stdout.write('\n'); process.exit(1);
      } else if (s === '\u007f' || s === '\b') { // backspace
        buf = buf.slice(0, -1);
      } else {
        buf += s;
      }
    };
    let buf = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}
