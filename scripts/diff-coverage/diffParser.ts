// scripts/diff-coverage/diffParser.ts

import { execSync } from 'child_process';
import { normalizePath } from './lcovParser';

export function isExcluded(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  if (!normalized.startsWith('lib/') && !normalized.startsWith('app/api/')) return true;
  if (normalized.includes('/__tests__/')) return true;
  if (normalized === 'lib/types.ts') return true;
  if (normalized.endsWith('.d.ts')) return true;
  return false;
}

export function getDiffCommand(baseRef?: string): string {
  if (baseRef) {
    return `git diff ${baseRef} --unified=0 -- lib/ app/api/`;
  }

  if (process.env.GITHUB_BASE_REF) {
    const base = `origin/${process.env.GITHUB_BASE_REF}`;
    return `git diff ${base} --unified=0 -- lib/ app/api/`;
  }

  if (process.env.GITHUB_EVENT_NAME === 'push') {
    try {
      execSync('git rev-parse --verify HEAD~1', { stdio: 'ignore' });
      return `git diff HEAD~1 --unified=0 -- lib/ app/api/`;
    } catch { /* premier commit */ }
  }

  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    if (currentBranch !== 'main') {
      try {
        execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
        return `git diff origin/main --unified=0 -- lib/ app/api/`;
      } catch {
        return `git diff main --unified=0 -- lib/ app/api/`;
      }
    }
  } catch { /* ignore */ }

  return `git diff HEAD --unified=0 -- lib/ app/api/`;
}

export function parseDiff(diffText: string): Map<string, number[]> {
  const changedLinesByFile = new Map<string, number[]>();
  let currentFile: string | null = null;

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+++ b/')) {
      const rawPath = line.substring(6).trim();
      currentFile = normalizePath(rawPath);
    } else if (line.startsWith('@@') && currentFile) {
      if (isExcluded(currentFile)) continue;

      const match = line.match(/\+([0-9]+)(?:,([0-9]+))?/);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] !== undefined ? parseInt(match[2], 10) : 1;
        if (count > 0) {
          let list = changedLinesByFile.get(currentFile);
          if (!list) {
            list = [];
            changedLinesByFile.set(currentFile, list);
          }
          for (let i = 0; i < count; i++) {
            list.push(start + i);
          }
        }
      }
    }
  }

  return changedLinesByFile;
}

export function formatRanges(lines: number[]): string {
  if (lines.length === 0) return '-';
  const ranges: string[] = [];
  let start = lines[0];
  let prev = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const curr = lines[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}
