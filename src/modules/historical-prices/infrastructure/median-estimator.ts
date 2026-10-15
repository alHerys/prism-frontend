import Decimal from "decimal.js";
import { decimal, DomainError } from "../../../shared/kernel/validation";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_EVEN });

/** Local estimate policy: every published reference in the requested unit contributes once. */
export function estimateMedian(prices: readonly string[], quantity: string) {
  decimal(quantity);
  if (!prices.length) throw new DomainError("INSUFFICIENT_DATA", "Belum ada referensi dengan satuan yang sama untuk kebutuhan ini.");
  const sorted = prices.map(price => { decimal(price); return new D(price); }).sort((a, b) => a.cmp(b));
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : sorted[middle - 1].plus(sorted[middle]).div(2);
  return { unitPrice: median.toFixed(), median: median.toFixed(), min: sorted[0].toFixed(), max: sorted[sorted.length - 1].toFixed(), total: median.times(quantity).toFixed() };
}
