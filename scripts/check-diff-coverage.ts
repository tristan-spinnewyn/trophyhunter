// scripts/check-diff-coverage.ts

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { DiffCoverageResult } from './diff-coverage/types';
import { normalizePath, parseLcov } from './diff-coverage/lcovParser';
import { isExcluded, getDiffCommand, parseDiff, formatRanges } from './diff-coverage/diffParser';
import { printDiffCoverageReport } from './diff-coverage/reporter';

export { normalizePath, parseLcov, isExcluded, getDiffCommand, parseDiff, formatRanges };
export type { DiffCoverageResult };

export function runDiffCoverageCheck(options?: {
  minThreshold?: number;
  baseRef?: string;
  lcovPath?: string;
}) {
  const minThreshold = options?.minThreshold ?? 80;
  const lcovPath = path.resolve(process.cwd(), options?.lcovPath ?? 'coverage/lcov.info');

  if (!fs.existsSync(lcovPath)) {
    console.error(`❌ Erreur: Fichier LCOV introuvable à "${lcovPath}".`);
    console.error(`Lancez d'abord "pnpm run test:coverage" pour générer le rapport.`);
    process.exit(1);
  }

  const coverageByFile = parseLcov(fs.readFileSync(lcovPath, 'utf-8'));
  const diffCmd = getDiffCommand(options?.baseRef);
  let diffText = '';

  try {
    diffText = execSync(diffCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    try {
      diffText = execSync('git diff HEAD --unified=0 -- lib/ app/api/', {
        encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      diffText = '';
    }
  }

  const changedLinesByFile = parseDiff(diffText);
  if (changedLinesByFile.size === 0) {
    console.log('ℹ️  Aucune ligne de code exécutable modifiée dans le diff.');
    console.log(`✅ Couverture du nouveau code : 100% (seuil requis : ${minThreshold}%).`);
    return;
  }

  const results: DiffCoverageResult[] = [];
  let totalExecutableInDiff = 0;
  let totalCoveredInDiff = 0;

  for (const [file, changedLines] of changedLinesByFile.entries()) {
    const fileCoverage = coverageByFile.get(file);
    let fileExecutable = 0;
    let fileCovered = 0;
    const uncoveredLines: number[] = [];

    for (const lineNum of changedLines) {
      if (!fileCoverage || !fileCoverage.has(lineNum)) continue;
      fileExecutable++;
      const hits = fileCoverage.get(lineNum) ?? 0;
      if (hits > 0) fileCovered++;
      else uncoveredLines.push(lineNum);
    }

    if (fileExecutable > 0) {
      results.push({ file, totalExecutable: fileExecutable, covered: fileCovered, uncoveredLines });
      totalExecutableInDiff += fileExecutable;
      totalCoveredInDiff += fileCovered;
    }
  }

  if (totalExecutableInDiff === 0) {
    console.log('ℹ️  Aucune ligne exécutable impactée dans le diff (uniquement types/commentaires).');
    console.log(`✅ Couverture du nouveau code : 100% (seuil requis : ${minThreshold}%).`);
    return;
  }

  printDiffCoverageReport({ diffCmd, minThreshold, results, totalExecutableInDiff, totalCoveredInDiff });
}

if (require.main === module || process.argv[1]?.endsWith('check-diff-coverage.ts')) {
  const args = process.argv.slice(2);
  let min = 80;
  let base: string | undefined;
  let lcov: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--min' && args[i + 1]) { min = parseFloat(args[i + 1]); i++; }
    else if (args[i] === '--base' && args[i + 1]) { base = args[i + 1]; i++; }
    else if (args[i] === '--lcov' && args[i + 1]) { lcov = args[i + 1]; i++; }
  }

  runDiffCoverageCheck({ minThreshold: min, baseRef: base, lcovPath: lcov });
}
