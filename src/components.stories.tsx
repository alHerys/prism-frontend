import { DataTable } from "./shared/ui/data-table";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge } from "./shared/ui/badge";
import { Button } from "./shared/ui/button";
import { EmptyState } from "./shared/ui/empty-state";
import { ErrorState } from "./shared/ui/error-state";
import { Field } from "./shared/ui/field";
import { Hint } from "./shared/ui/hint";
import { LoadingState } from "./shared/ui/loading-state";
import { PageTabs } from "./shared/ui/page-tabs";
import { SelectField } from "./shared/ui/select-field";
import { SourcePanel } from "./shared/ui/source-panel";
import { TableToolbar } from "./shared/ui/table-toolbar";
import { UploadZone } from "./shared/ui/upload-zone";
import { Modal } from "./shared/ui/modal";
import { Stepper } from "./shared/ui/stepper";


const meta = {
  title: "PRISM/Komponen",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tombol: Story = {
  render: () => (
    <div className="toolbar">
      <Button variant="primary">
        <PlusIcon size={16} />
        Tambah pengadaan
      </Button>
      <Button>Simpan perubahan</Button>
      <Button variant="quiet">Batal</Button>
      <Button variant="danger">Buang perubahan</Button>
      <Button disabled>Konfirmasi</Button>
      <Button disabled variant="primary">
        Memeriksa data…
      </Button>
      <Hint label="Buat pengadaan baru">
        <Button aria-label="Tambah pengadaan">
          <PlusIcon size={16} />
        </Button>
      </Hint>
    </div>
  ),
};
export const Status: Story = {
  render: () => (
    <div className="toolbar">
      <Badge>Belum lengkap</Badge>
      <Badge tone="success">Terkonfirmasi</Badge>
      <Badge tone="warning">Perlu ditinjau</Badge>
      <Badge tone="error">Pembacaan gagal</Badge>
      <Badge tone="info">Menunggu evaluasi</Badge>
      <Badge tone="warning">2 pasangan item perlu ditinjau</Badge>
    </div>
  ),
};
function FormExample() {
  const [functionValue, setFunctionValue] = useState("");
  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <Field
        label="Judul pengadaan"
        htmlFor="story-name"
        help="Gunakan nama yang mudah dikenali."
      >
        <input
          id="story-name"
          aria-describedby="story-name-help"
          defaultValue="Pemeliharaan fasilitas Terminal BBM Balikpapan"
        />
      </Field>
      <Field label="Fungsi" htmlFor="story-function">
        <SelectField
          id="story-function"
          ariaLabel="Fungsi"
          items={[
            { value: "operasi", label: "Operasi Terminal BBM Balikpapan" },
            {
              value: "procurement",
              label: "Procurement Kalimantan — Dukungan operasional wilayah",
            },
          ]}
          value={functionValue}
          onValueChange={setFunctionValue}
          placeholder="Pilih fungsi"
        />
      </Field>
      <Field
        label="Periode"
        htmlFor="story-period"
        error="Lengkapi periode sebelum menerbitkan dokumen."
      >
        <input
          id="story-period"
          aria-invalid="true"
          aria-describedby="story-period-error"
          placeholder="Contoh: 2026"
        />
      </Field>
      <Field
        label="Nama vendor"
        htmlFor="story-vendor"
        help="Data vendor sudah dikonfirmasi."
      >
        <input id="story-vendor" disabled value="PT Nusa Teknik" readOnly />
      </Field>
    </div>
  );
}
export const Formulir: Story = { render: () => <FormExample /> };
function TabsExample() {
  const [value, setValue] = useState("dokumen");
  return (
    <PageTabs
      ariaLabel="Bagian pengadaan"
      value={value}
      onValueChange={setValue}
      items={[
        { value: "dokumen", label: "Dokumen" },
        { value: "hea", label: "HEA & Leaderboard" },
        { value: "harga", label: "Harga Timpang" },
        { value: "riwayat", label: "Riwayat koreksi dan konfirmasi" },
      ]}
    >
      <div className="panel">
        <h2>
          {value === "dokumen"
            ? "Dokumen pengadaan"
            : value === "hea"
              ? "Persiapan HEA"
              : value === "harga"
                ? "Pasangan item"
                : "Riwayat"}
        </h2>
        <p>
          Pilih bagian pengadaan. Gunakan panah untuk berpindah fokus dan Enter
          untuk membuka.
        </p>
      </div>
    </PageTabs>
  );
}
export const Tab: Story = { render: () => <TabsExample /> };
function TableExample() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = Array.from({ length: 12 }, (_, i) => ({
    name:
      i === 0
        ? "Pemeliharaan dan rehabilitasi fasilitas operasional Terminal BBM Balikpapan tahun 2026"
        : `Pengadaan pemeliharaan fasilitas ${i + 1}`,
    count: (i % 3) + 1,
    number: String(i + 1).padStart(3, "0"),
    status: i % 2 ? "review" : "confirmed",
  }));
  return (
    <section className="panel">
      <TableToolbar>
        <div className="search">
          <MagnifyingGlassIcon aria-hidden="true" />
          <input
            aria-label="Cari pengadaan"
            placeholder="Cari nama atau nomor pengadaan"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div style={{ width: 210 }}>
          <SelectField
            ariaLabel="Status dokumen"
            value={status}
            onValueChange={setStatus}
            items={[
              { value: "all", label: "Semua status" },
              { value: "review", label: "Perlu ditinjau" },
              { value: "confirmed", label: "Terkonfirmasi" },
            ]}
          />
        </div>
      </TableToolbar>
      <div className="table-wrap">
        <DataTable rows={rows.filter(row => (status === "all" || row.status === status) && row.name.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")))} label="Contoh pengadaan" columns={[
  { label: "Pengadaan", value: row => row.name },
  { label: "Dokumen", value: row => row.count },
  { label: "Kesiapan", value: row => row.status, filter: row => row.status === "review" ? "Perlu ditinjau" : "Terkonfirmasi" },
]}>{(row) => (
                <tr key={row.name}>
                  <td>
                    {row.name}
                    <small>
                      PGD-2026-{row.number} · Operasi
                      Terminal
                    </small>
                  </td>
                  <td>{row.count} dokumen</td>
                  <td>
                    <Badge
                      tone={row.status === "review" ? "warning" : "success"}
                    >
                      {row.status === "review"
                        ? "Perlu ditinjau"
                        : "Terkonfirmasi"}
                    </Badge>
                  </td>
                </tr>
              )}</DataTable>
      </div>
    </section>
  );
}
export const TabelDanFilter: Story = { render: () => <TableExample /> };
function UploadExample() {
  const [name, setName] = useState("");
  return (
    <div>
      <UploadZone
        accept=".pdf,.xlsx"
        ariaLabel="Pilih berkas"
        onFiles={(files) => setName(files.map((file) => file.name).join(", "))}
      >
        Tarik dokumen ke sini, atau pilih berkas dari komputer. PDF Form A5 atau
        XLSX OE/penawaran, maksimum 10 MiB.
      </UploadZone>
      {name ? <p role="status">Berkas dipilih: {name}</p> : null}
      <UploadZone disabled onFiles={() => { }} ariaLabel="Pilih berkas">
        Membaca dokumen yang dipilih.
      </UploadZone>
      <LoadingState label="Membaca dokumen…" />
    </div>
  );
}
export const Unggah: Story = { render: () => <UploadExample /> };
export const Progres: Story = {
  render: () => (
    <div>
      {[0, 2, 4].map((stage) => (
        <Stepper key={stage} stage={stage} />
      ))}
    </div>
  ),
};
function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Konfirmasi dokumen</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Konfirmasi data dokumen"
        description="Pastikan nilai yang ditinjau sesuai dengan sumber. Koreksi berikutnya membatalkan konfirmasi terkait."
      >
        <div className="modal-actions">
          <Button onClick={() => setOpen(false)}>Kembali memeriksa</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Konfirmasi
          </Button>
        </div>
      </Modal>
    </>
  );
}
export const Dialog: Story = { render: () => <DialogExample /> };
export const BuktiSumber: Story = {
  render: () => (
    <SourcePanel title="Jejak sumber">
      <div className="paper">
        <div className="paper-header">
          <h3>Form A5 — PT Nusa Teknik</h3>
          <small>Halaman 1 · Tabel komponen biaya</small>
        </div>
        <dl>
          <div>
            <dt>Nilai penawaran</dt>
            <dd>Rp1.400.000.000</dd>
          </div>
          <div>
            <dt>TKDN jasa</dt>
            <dd>35%</dd>
          </div>
        </dl>
        <p className="evidence">
          Nilai yang ditinjau berasal dari tabel komponen biaya dalam dokumen
          yang dipilih.
        </p>
      </div>
    </SourcePanel>
  ),
};
function StateExample() {
  const [retried, setRetried] = useState(false);
  return (
    <div className="grid">
      <div className="panel">
        <EmptyState title="Belum ada snapshot hasil">
          Konfirmasikan dokumen dan preferensi pengadaan untuk menjalankan
          evaluasi.
        </EmptyState>
      </div>
      <div className="panel">
        {retried ? (
          <LoadingState label="Memeriksa ulang dokumen…" />
        ) : (
          <ErrorState
            message="Format dokumen ini belum didukung. Pilih berkas yang sesuai atau coba kembali."
            onRetry={() => setRetried(true)}
          />
        )}
      </div>
      <div className="panel">
        <ErrorState message="Referensi yang sebanding belum memadai. Pilih dokumen dari periode atau fungsi yang sesuai." />
      </div>
    </div>
  );
}
export const KosongDanGagal: Story = { render: () => <StateExample /> };
