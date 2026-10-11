import type { ProcurementData } from "../../modules/procurement/application/queries";

export interface MonthlyAdditions {
  current: number;
  previous: number;
  change: number;
}

const wibOffset = 7 * 60 * 60 * 1000;

/** New entries in WIB calendar months, not changes in the current stock total. */
export function monthlyAdditions(timestamps: readonly string[], now: Date): MonthlyAdditions {
  const present = now.getTime();
  if (!Number.isFinite(present)) throw new RangeError("A valid reference date is required");
  const wib = new Date(present + wibOffset);
  const year = wib.getUTCFullYear();
  const month = wib.getUTCMonth();
  const currentStart = Date.UTC(year, month, 1) - wibOffset;
  const previousStart = Date.UTC(year, month - 1, 1) - wibOffset;
  let current = 0;
  let previous = 0;
  for (const timestamp of timestamps) {
    const time = Date.parse(timestamp);
    if (!Number.isFinite(time) || time > present) continue;
    if (time >= currentStart) current += 1;
    else if (time >= previousStart) previous += 1;
  }
  return { current, previous, change: current - previous };
}

export function describeMonthlyAdditions(statistic: MonthlyAdditions, activity: string): string {
  const delta = statistic.change > 0 ? `+${statistic.change}` : `${statistic.change}`;
  return `${statistic.current} ${activity} bulan ini · ${delta} dibanding bulan lalu (WIB)`;
}

export function dashboardStatistics(state: ProcurementData, now: Date) {
  return {
    procurements: monthlyAdditions(state.procurements.map((entry) => entry.createdAt), now),
    documents: monthlyAdditions(state.documents.map((entry) => entry.uploadedAt), now),
    evaluations: monthlyAdditions(state.snapshots.map((entry) => entry.createdAt), now),
    // Only upload dates are recorded. This is the age of the current review queue,
    // not a historical series of when documents entered or left review.
    pendingUploads: monthlyAdditions(state.documents.filter((entry) => entry.status === "REVIEW_REQUIRED").map((entry) => entry.uploadedAt), now),
  };
}
