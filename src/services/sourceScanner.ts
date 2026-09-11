import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const HDL_EXTENSIONS = new Set(['.v', '.sv', '.vh', '.svh']);
const DEFAULT_EXCLUDES = ['.git', 'node_modules', '.vscode', 'work', 'build', 'sim', 'out', 'dist', 'coverage'];

export interface ScanOptions { excludedDirectories?: string[]; sourceOrder?: string[]; }

export async function discoverSources(root: string, options: ScanOptions = {}): Promise<string[]> {
  const excluded = new Set([...DEFAULT_EXCLUDES, ...(options.excludedDirectories ?? [])].map(name => name.toLowerCase()));
  const sources: string[] = [];
  async function walk(directory: string): Promise<void> {
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name.toLowerCase())) { await walk(absolute); }
      } else if (entry.isFile() && HDL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        sources.push(absolute);
      }
    }
  }
  await walk(root);
  return orderSources(sources, root, options.sourceOrder ?? []);
}

function globToRegExp(glob: string): RegExp {
  let expression = '';
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === '*' && glob[index + 1] === '*') {
      index += 1;
      if (glob[index + 1] === '/') { expression += '(?:.*/)?'; index += 1; }
      else { expression += '.*'; }
    } else if (character === '*') { expression += '[^/]*'; }
    else if (character === '?') { expression += '[^/]'; }
    else { expression += /[.+^${}()|[\]\\]/.test(character) ? `\\${character}` : character; }
  }
  return new RegExp(`^${expression}$`, 'i');
}

function defaultRank(relative: string): number {
  const lower = relative.toLowerCase();
  const extension = path.extname(lower);
  if (extension === '.vh' || extension === '.svh') { return 0; }
  if (/(^|[/_\\-])(pkg|package)([/_\\-]|\.|$)|_pkg\.(sv|v)$/.test(lower)) { return 1; }
  if (/(^|[/\\])(tb|test|tests|verification)([/\\])|(_tb|_test)\.(sv|v)$/.test(lower)) { return 3; }
  return 2;
}

export function orderSources(files: string[], root: string, sourceOrder: string[] = []): string[] {
  const normalized = (file: string) => path.relative(root, file).split(path.sep).join('/');
  const custom = sourceOrder.map(globToRegExp);
  return [...files].sort((left, right) => {
    const leftRelative = normalized(left); const rightRelative = normalized(right);
    const leftCustom = custom.findIndex(pattern => pattern.test(leftRelative));
    const rightCustom = custom.findIndex(pattern => pattern.test(rightRelative));
    const leftRank = leftCustom === -1 ? custom.length + defaultRank(leftRelative) : leftCustom;
    const rightRank = rightCustom === -1 ? custom.length + defaultRank(rightRelative) : rightCustom;
    return leftRank - rightRank || leftRelative.localeCompare(rightRelative);
  });
}

export function sourceListText(root: string, sources: string[]): string {
  return sources.map(source => `./${path.relative(root, source).split(path.sep).join('/')}`).join('\n') + (sources.length ? '\n' : '');
}
