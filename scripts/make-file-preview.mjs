import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outputPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const html = await readFile(outputPath, 'utf8');
const classicScript = html.replace(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/,
  '<script defer src="$1"></script>',
);

if (classicScript === html) {
  throw new Error('Could not find the Vite entry script to prepare the file preview.');
}

await writeFile(outputPath, classicScript);
