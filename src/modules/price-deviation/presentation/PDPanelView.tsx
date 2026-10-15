import { Link } from "react-router";
import type { PDPanelProps } from "./input-models";
import type { PDPanelModel } from "./view-models";
import type { PriceEmptyReason } from "../application/vendor-result";
import { EmptyState } from "../../../shared/ui/empty-state";
import { SelectField } from "../../../shared/ui/select-field";
import "../../../shared/styles/fernly-evaluation.css";

const guidance: Record<PriceEmptyReason, { title: string; text: string; action?: "vendor" | "procurement" }> = {
  "no-vendors": { title: "Belum ada vendor", text: "Tambahkan vendor dan dokumennya sebelum melihat Harga Timpang.", action: "procurement" },
  "choose-vendor": { title: "Pilih vendor untuk melihat hasil Harga Timpang.", text: "Hasil dan laporan ditampilkan untuk satu vendor yang dipilih." },
  "no-oe": { title: "OE belum tersedia", text: "Unggah dan simpan OE pengadaan sebagai pembanding.", action: "procurement" },
  "oe-review": { title: "OE belum tersimpan", text: "Periksa lalu simpan OE sebelum melihat hasil vendor ini.", action: "procurement" },
  "no-offer": { title: "Belum ada penawaran harga untuk vendor ini", text: "Unggah dan simpan penawaran harga vendor yang dipilih.", action: "vendor" },
  "offer-review": { title: "Penawaran harga belum tersimpan", text: "Periksa lalu simpan penawaran vendor ini sebelum melihat hasil.", action: "vendor" },
  "no-result": { title: "Belum ada hasil Harga Timpang untuk vendor ini", text: "Sumber sudah tersimpan, tetapi hasil untuk penawaran ini belum tersedia.", action: "vendor" },
};

export function PDPanelView({ ResultView, p, vendors, vendor, result, selectVendor }: PDPanelModel & Pick<PDPanelProps, "ResultView">) {
  const empty = result.kind === "empty" ? guidance[result.reason] : undefined;
  const workspace = `/pengadaan/${encodeURIComponent(p.id)}?tab=ringkasan`;
  return <div className="evaluation-workflow price-workflow">
    <section className="panel price-vendor-selector" aria-label="Pilihan vendor Harga Timpang">
      <div className="field"><label htmlFor="price-vendor">Vendor</label>
        <SelectField id="price-vendor" ariaLabel="Vendor Harga Timpang" placeholder="Pilih vendor" value={vendor?.id ?? ""}
          items={vendors.map(v => ({ value: v.id, label: v.name }))} onValueChange={selectVendor} disabled={!vendors.length} />
      </div>
      {vendor && <div className="price-vendor-context"><strong>{vendor.name}</strong>
        {result.kind === "ready" && <p>Penawaran: {result.offerName}</p>}
      </div>}
    </section>
    {result.kind === "ready" ? <ResultView key={result.snapshot.id} snapshot={result.snapshot} procurement={p} /> : empty &&
      <section className="panel"><EmptyState title={empty.title}>{empty.text}
        {empty.action && <p><Link className="btn" to={empty.action === "vendor" && vendor ? `${workspace}&vendor=${encodeURIComponent(vendor.id)}` : workspace}>
          {empty.action === "vendor" ? "Buka dokumen vendor" : "Buka identitas & vendor"}
        </Link></p>}
      </EmptyState></section>}
  </div>;
}
