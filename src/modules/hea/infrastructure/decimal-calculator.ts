import Decimal from "decimal.js";
import type { HEACalculator, HEACalculationInput } from "../application/calculation";
import type { Preferences } from "../domain/models";
import { decimal } from "../../../shared/kernel/validation";

// An independent context keeps document formatting and other library consumers isolated.
const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_EVEN });
export const localHEAPolicy = { id: "hea-sample-v1", goodsThreshold: "0.25", servicesThreshold: "0.30", precision: 50 } as const;
const text = (value: Decimal) => value.toFixed();

function calculate(input: HEACalculationInput, preferences: Preferences) {
  const v = input.values;
  for (const key of ["hpb", "hpj", "knb"] as const) decimal(v[key]);
  for (const key of ["tkdn_barang", "tkdn_jasa"] as const) decimal(v[key], true);
  const goods = new D(v.hpb), services = new D(v.hpj);
  const kpb = new D(v.tkdn_barang).gte(localHEAPolicy.goodsThreshold) ? new D(v.tkdn_barang).times(preferences.preferensi_barang) : new D(0);
  const kpj = new D(v.tkdn_jasa).gte(localHEAPolicy.servicesThreshold) ? new D(v.tkdn_jasa).times(preferences.preferensi_jasa) : new D(0);
  const heGoods = goods.div(new D(1).plus(kpb));
  const heServices = services.div(new D(1).plus(kpj));
  const heCombined = heGoods.plus(heServices);
  const total = goods.plus(services);
  return {
    vendorId: input.vendorId, vendorName: input.vendorName, source: input.source,
    hea: text(heCombined.plus(v.knb)),
    calculation: {
      total: text(total),
      ...(total.isZero() ? {} : { tkdnCombined: text(goods.times(v.tkdn_barang).plus(services.times(v.tkdn_jasa)).div(total)) }),
      kpb: text(kpb), kpj: text(kpj), heGoods: text(heGoods), heServices: text(heServices), heCombined: text(heCombined),
    },
  };
}

export const decimalHEACalculator: HEACalculator = {
  evaluate(inputs, preferences) {
    decimal(preferences.preferensi_barang, true); decimal(preferences.preferensi_jasa, true);
    const rows = inputs.map(input => calculate(input, preferences)).sort((a, b) => new D(a.hea).cmp(b.hea));
    let rank = 0;
    return rows.map((row, index) => {
      if (!index || !new D(row.hea).eq(rows[index - 1].hea)) rank = index + 1;
      return { ...row, rank };
    });
  },
};
