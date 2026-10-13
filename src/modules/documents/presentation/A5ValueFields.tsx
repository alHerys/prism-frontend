import type { A5Values } from "../domain/models";
import { CurrencyInput } from "../../../shared/ui/currency-input";
import { toPercent } from "../../../shared/formatting/review-input";
import { fields } from "./review-fields";

export function A5ValueFields({ values, candidate, onChange, onFocus, idPrefix = "" }: {
  values: A5Values; candidate: A5Values; onChange: (key: keyof A5Values, value: string) => void;
  onFocus?: (key: keyof A5Values) => void; idPrefix?: string;
}) {
  return <div className="form-grid review-values">
    {(["hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa"] as const).map(key => {
      const id = `${idPrefix}${key}`;
      const original = key.startsWith("tkdn") ? candidate[key] ? toPercent(candidate[key]) : "" : candidate[key];
      return <div className={`field review-value-field${key === "knb" ? " review-value-wide" : ""}`} key={key}>
        <label htmlFor={id}>{fields[key]}{key.startsWith("tkdn") ? " (%)" : ""}</label>
        {key.startsWith("tkdn") ? <input id={id} value={values[key]} inputMode="decimal" onFocus={() => onFocus?.(key)} onChange={e => onChange(key, e.target.value)} />
          : <CurrencyInput id={id} value={values[key]} onFocus={() => onFocus?.(key)} onValueChange={value => onChange(key, value)} />}
        {values[key] !== original && <div className="review-field-meta"><span className="badge info">Dikoreksi</span></div>}
      </div>;
    })}
  </div>;
}
