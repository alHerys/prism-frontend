import { BookOpen } from "@phosphor-icons/react/dist/csr/BookOpen";
import { Files } from "@phosphor-icons/react/dist/csr/Files";
import { Scales } from "@phosphor-icons/react/dist/csr/Scales";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { Lifebuoy } from "@phosphor-icons/react/dist/csr/Lifebuoy";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { useState } from "react";
import { Link } from "react-router";
import { useHelpSearch } from "../../shared/ui/help-search";
import { HELP_FAQS, HELP_TOPICS } from "./help-content";
import "../../shared/styles/features/help.css";
const icons = { start: BookOpen, documents: Files, evaluation: Scales, history: Database };
const shortcuts = [
  ["Ctrl / ⌘ K", "Fokus ke pencarian"], ["/", "Fokus ke pencarian"],
  ["G D", "Dashboard"], ["G P", "Pengadaan"], ["G B", "Bank Data OE"],
  ["G R", "Riwayat & Statistik"], ["G S", "Pengaturan"], ["G H", "Bantuan"], ["Esc", "Tutup menu atau dialog"],
];
export default function HelpPage() {
  const { query } = useHelpSearch();
  const [topic, setTopic] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const normalized = query.trim().toLocaleLowerCase("id-ID");
  const faqs = HELP_FAQS.filter(faq => (!topic || faq.topic === topic) && `${faq.title} ${faq.answer}`.toLocaleLowerCase("id-ID").includes(normalized));
  const toggle = (id: string) => setExpanded(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <div className="page help-page">
    <section className="help-hero" aria-labelledby="help-hero-heading">
      <h2 id="help-hero-heading">Apa yang ingin Anda ketahui?</h2>
      <p>Gunakan pencarian di atas atau pilih topik untuk menemukan panduan PRISM.</p>
      <div className="help-topics" aria-label="Topik bantuan">
        {HELP_TOPICS.map(item => { const Icon = icons[item.id]; return <button key={item.id} className="help-topic" aria-pressed={topic === item.id} onClick={() => setTopic(current => current === item.id ? "" : item.id)}><Icon size={23} aria-hidden="true" /><span><strong>{item.label}</strong><small>{HELP_FAQS.filter(faq => faq.topic === item.id).length} artikel</small></span></button>; })}
      </div>
    </section>
    <div className="help-layout">
      <section className="panel help-faq" aria-labelledby="help-faq-heading">
        <div className="panel-header"><h2 id="help-faq-heading">Pertanyaan umum</h2>{topic && <button className="btn quiet small" onClick={() => setTopic("")}>Tampilkan semua</button>}</div>
        <p className="sr-only" role="status">{faqs.length} artikel ditemukan</p>
        {!faqs.length && <div className="help-empty"><h3>Artikel belum ditemukan</h3><p>Coba kata lain{topic ? " atau pilih Tampilkan semua untuk mencari di seluruh topik" : " seperti dokumen, evaluasi, atau profil"}.</p></div>}
        {faqs.map(faq => { const open = expanded.has(faq.id); return <article className="help-faq-item" key={faq.id}>
          <h3><button id={`help-q-${faq.id}`} aria-expanded={open} aria-controls={`help-a-${faq.id}`} onClick={() => toggle(faq.id)}>{faq.title}<span className="help-faq-symbol"><Plus size={17} aria-hidden="true" /></span></button></h3>
          <div id={`help-a-${faq.id}`} className="help-answer" data-open={open} role="region" aria-labelledby={`help-q-${faq.id}`} aria-hidden={!open} inert={!open}><div><p>{faq.answer}</p><Link to={faq.link}>{faq.action}</Link></div></div>
        </article>; })}
      </section>
      <aside className="help-aside">
        <section className="panel help-shortcuts" aria-labelledby="help-shortcuts-heading"><h2 id="help-shortcuts-heading">Pintasan keyboard</h2><dl>{shortcuts.map(([keys, label]) => <div key={`${keys}-${label}`}><dt><kbd>{keys}</kbd></dt><dd>{label}</dd></div>)}</dl><p>Pintasan navigasi tersedia saat Anda tidak sedang mengetik atau membuka dialog.</p></section>
        <section className="panel help-contact" aria-labelledby="help-contact-heading"><Lifebuoy size={30} aria-hidden="true" /><h2 id="help-contact-heading">Perlu bantuan lebih lanjut?</h2><p>Kontak bantuan belum tersedia. Gunakan panduan di atas untuk menelusuri langkah penggunaan PRISM.</p><div><button className="btn small" disabled>Mulai chat</button><button className="btn small" disabled>Email bantuan</button></div></section>
      </aside>
    </div>
  </div>;
}
