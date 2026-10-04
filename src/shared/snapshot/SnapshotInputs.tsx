import "../styles/bank.css";
const categoryLabel: Record<string, string> = {
  MATERIAL: "Material",
  SERVICE: "Jasa",
};
const classificationLabel: Record<string, string> = {
  TIMPANG: "Timpang",
  TIDAK_TIMPANG: "Tidak timpang",
};
export function SnapshotInputs({ value }: { value: unknown }) {
  const labels: Record<string, string> = {
    procurement: "Pengadaan",
    documents: "Dokumen",
    name: "Nama",
    number: "Nomor pengadaan",
    functionName: "Fungsi",
    revision: "Revisi",
    reviewed: "Nilai review",
    candidate: "Nilai sumber",
    hpb: "Harga penawaran barang",
    hpj: "Harga penawaran jasa",
    knb: "KNB",
    tkdn_barang: "TKDN barang (rasio)",
    tkdn_jasa: "TKDN jasa (rasio)",
    preferences: "Preferensi",
    preferensi_barang: "Barang (rasio)",
    preferensi_jasa: "Jasa (rasio)",
    period: "Periode",
    references: "Referensi",
    description: "Uraian",
    unit: "Satuan",
    price: "Harga satuan",
    documentName: "Dokumen",
    oe: "OE",
    offer: "Penawaran",
    source: "Sumber",
    sources: "Bukti sumber",
    location: "Lokasi",
    quote: "Nilai sumber",
    field: "Field",
    status: "Status",
    selectedGroup: "Kelompok harga",
    pairs: "Pasangan",
    category: "Kategori",
    statistics: "Statistik harga",
    min: "Minimum (Rp)",
    median: "Median (Rp)",
    max: "Maksimum (Rp)",
    warnings: "Peringatan",
    policy: "Kebijakan",
  };
  if (value == null) return <span>—</span>;
  if (Array.isArray(value))
    return (
      <div>
        {value.map((item, index) => (
          <div className="bank-snapshot-group" key={index}>
            <SnapshotInputs value={item} />
          </div>
        ))}
      </div>
    );
  if (typeof value === "object")
    return (
      <dl className="bank-snapshot-values">
        {Object.entries(value)
          .filter(([key]) => key in labels)
          .map(([key, item]) => (
            <div key={key}>
              <dt>{labels[key]}</dt>
              <dd>
                <SnapshotInputs value={item} />
              </dd>
            </div>
          ))}
      </dl>
    );
  if (typeof value === "string" && categoryLabel[value])
    return <span>{categoryLabel[value]}</span>;
  if (typeof value === "string" && classificationLabel[value])
    return <span>{classificationLabel[value]}</span>;
  if (value === "CONFIRMED") return <span>Terkonfirmasi</span>;
  if (value === "REVIEW_REQUIRED") return <span>Perlu ditinjau</span>;
  return <span>{String(value)}</span>;
}
