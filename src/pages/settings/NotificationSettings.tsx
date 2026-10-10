import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FolderSimple } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { Scales } from "@phosphor-icons/react/dist/csr/Scales";
import type { NotificationCategory } from "../../shared/kernel/workspace-preferences";

const categories = [
  { key: "procurement", label: "Pengadaan & vendor", text: "Pemberitahuan saat pengadaan dibuat atau vendor ditambahkan.", Icon: FolderSimple },
  { key: "evaluation", label: "Evaluasi selesai", text: "Pemberitahuan saat evaluasi HEA atau Harga Timpang selesai.", Icon: Scales },
  { key: "export", label: "Ekspor laporan", text: "Pemberitahuan hasil ekspor laporan dan data evaluasi.", Icon: DownloadSimple },
  { key: "publication", label: "Publikasi historis", text: "Pemberitahuan saat referensi dipublikasikan ke Bank Data OE.", Icon: Database },
] satisfies { key: NotificationCategory; label: string; text: string; Icon: typeof Database }[];

export function NotificationSettings({ values, change }: {
  values: Record<NotificationCategory, boolean>;
  change: (category: NotificationCategory, enabled: boolean) => void;
}) {
  return (
    <section className="settings-card" aria-labelledby="notifications-heading">
      <header className="settings-section-heading">
        <h2 id="notifications-heading">Notifikasi operasional</h2>
        <p>Pilih pembaruan yang ingin ditampilkan di ruang kerja. Perubahan langsung diterapkan.</p>
      </header>
      <div className="settings-notification-list">
        {categories.map(({ key, label, text, Icon }) => (
          <div className="settings-notification-row" key={key}>
            <Icon size={23} className="settings-row-icon" aria-hidden="true" />
            <div><h3 id={`notification-${key}`}>{label}</h3><p id={`notification-${key}-description`}>{text}</p></div>
            <button type="button" className="settings-switch" role="switch" aria-checked={values[key]} aria-labelledby={`notification-${key}`} aria-describedby={`notification-${key}-description`} onClick={() => change(key, !values[key])}><span /></button>
          </div>
        ))}
      </div>
      <p className="settings-safety-note">Peringatan kesalahan, validasi data, dan konfirmasi wajib tetap ditampilkan.</p>
    </section>
  );
}
