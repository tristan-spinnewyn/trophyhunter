// scripts/diff-coverage/lcovParser.ts

import path from 'path';

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function parseLcov(lcovContent: string): Map<string, Map<number, number>> {
  const coverageByFile = new Map<string, Map<number, number>>();

  let currentFile: string | null = null;
  let currentFileMap: Map<number, number> | null = null;

  for (const line of lcovContent.split(/\r?\n/)) {
    if (line.startsWith('SF:')) {
      const rawPath = line.substring(3).trim();
      currentFile = normalizePath(path.relative(process.cwd(), rawPath));
      currentFileMap = new Map<number, number>();
      coverageByFile.set(currentFile, currentFileMap);
    } else if (line.startsWith('DA:') && currentFileMap) {
      const parts = line.substring(3).split(',');
      const lineNum = parseInt(parts[0], 10);
      const hitCount = parseInt(parts[1], 10);
      currentFileMap.set(lineNum, hitCount);
    } else if (line === 'end_of_record') {
      currentFile = null;
      currentFileMap = null;
    }
  }

  return coverageByFile;
}
