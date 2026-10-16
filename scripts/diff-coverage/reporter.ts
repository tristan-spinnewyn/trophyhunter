// scripts/diff-coverage/reporter.ts

import type { DiffCoverageResult } from './types';
import { formatRanges } from './diffParser';

interface PrintReportParams {
  diffCmd: string;
  minThreshold: number;
  results: DiffCoverageResult[];
  totalExecutableInDiff: number;
  totalCoveredInDiff: number;
}

export function printDiffCoverageReport({
  diffCmd,
  minThreshold,
  results,
  totalExecutableInDiff,
  totalCoveredInDiff,
}: PrintReportParams): void {
  const diffCoveragePct = (totalCoveredInDiff / totalExecutableInDiff) * 100;

  console.log('\n======================== RAPPORT DE COUVERTURE DU NOUVEAU CODE ========================');
  console.log(`Commande diff : ${diffCmd}`);
  console.log(`Seuil requis  : ${minThreshold.toFixed(1)}%\n`);

  console.log(
    'Fichier'.padEnd(50) +
    'Lignes'.padStart(8) +
    'Couvertes'.padStart(12) +
    'Couv. %'.padStart(10) +
    '   Lignes non couvertes'
  );
  console.log('-'.repeat(96));

  for (const r of results) {
    const pct = ((r.covered / r.totalExecutable) * 100).toFixed(1) + '%';
    const uncovered = formatRanges(r.uncoveredLines);
    console.log(
      r.file.padEnd(50) +
      String(r.totalExecutable).padStart(8) +
      String(r.covered).padStart(12) +
      pct.padStart(10) +
      '   ' + uncovered
    );
  }

  console.log('-'.repeat(96));
  console.log(
    `TOTAL NOUVEAU CODE: ${totalCoveredInDiff}/${totalExecutableInDiff} lignes exécutables couvertes (${diffCoveragePct.toFixed(2)}%)`
  );
  console.log('========================================================================================\n');

  if (diffCoveragePct < minThreshold) {
    console.error(
      `❌ ÉCHEC: La couverture du nouveau code (${diffCoveragePct.toFixed(2)}%) est inférieure au seuil de ${minThreshold}%.`
    );
    console.error(`Veuillez ajouter des tests unitaires pour couvrir les lignes signalées ci-dessus.\n`);
    process.exit(1);
  } else {
    console.log(
      `✅ SUCCÈS: La couverture du nouveau code (${diffCoveragePct.toFixed(2)}%) respecte le seuil de ${minThreshold}%!\n`
    );
  }
}
