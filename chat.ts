import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function promptUser(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    rl.question(`${prompt}\n> `, (message: string) => {
      if (message.toLowerCase() === 'exit') {
        console.log('Exiting chat...');
        rl.close();
        reject();
      } else {
        resolve(message);
      }
    });
  });
}
