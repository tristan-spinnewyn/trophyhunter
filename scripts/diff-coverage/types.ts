// scripts/diff-coverage/types.ts

export interface DiffCoverageResult {
  file: string;
  totalExecutable: number;
  covered: number;
  uncoveredLines: number[];
}
