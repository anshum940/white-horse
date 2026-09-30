import type { ReportingPeriod } from './types';

/** A new company workspace has no comparative cash-flow workpaper yet. */
export function hasComparativeCashFlowSummary(period: ReportingPeriod): boolean {
  return Object.values(period.comparativeCashFlowSummary).some((amount) => amount !== 0);
}
