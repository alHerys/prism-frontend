import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CircleNotch } from "@phosphor-icons/react/dist/csr/CircleNotch";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import "../../../shared/styles/bank.css";
import { HeaderAction } from "../../../shared/ui/header-action";
import { PageTabs } from "../../../shared/ui/page-tabs";
import { BankReferences } from "./BankReferences";
import { BankOverview } from "./BankOverview";
import { HistoricalDocuments } from "./HistoricalDocuments";
import { HistoricalDraft } from "./HistoricalDraft";
import { HistoricalEstimate } from "./HistoricalEstimate";
import { HistoricalStatistics } from "./HistoricalStatistics";
import { HistoricalUpload } from "./HistoricalUpload";
import { ReferenceDetail } from "./ReferenceDetail";

import type { BankPageModel } from "./view-models";
export function BankPageView({
  state,
  tab,
  setTab,
  query,
  setQuery,
  year,
  setYear,
  functionFilter,
  setFunctionFilter,
  selectedIds,
  detail,
  setDetail,
  showUpload,
  setShowUpload,
  setDraftId,
  functionName,
  setFunctionName,
  period,
  setPeriod,
  procurementId,
  setProcurementId,
  busy,
  notice,
  error,
  setError,
  need,
  setNeed,
  unit,
  setUnit,
  quantity,
  setQuantity,
  draft,
  estimate,
  filtered,
  selected,
  statistics,
  statsReady,
  years,
  functions,
  toggle,
  upload,
  saveDraft,
  confirmDraft,
  publishDraft,
  exportStats,
  createEstimate,
  compareReference,
}: BankPageModel) {

  return (
    <div className="page bank-page">
      <HeaderAction>
        <button
          className="btn primary"
          onClick={() => {
            setShowUpload(!showUpload);
            setDraftId("");
            setError("");
          }}
        >
          <Plus size={17} />
          Tambah dokumen historis
        </button>
      </HeaderAction>
      <BankOverview visible={tab === "Dokumen Historis" || tab === "Pencarian Referensi"} state={state} selected={selected} setTab={(value) => {
        setTab(value);
        setDetail(undefined);
        setError("");
      }} />
      <PageTabs
        ariaLabel="Bagian Bank Data OE"
        value={tab}
        items={[
          "Dokumen Historis",
          "Pencarian Referensi",
          "Statistik Harga",
          "Bantuan Estimasi",
        ].map((label) => ({ label, value: label }))}
        onValueChange={(value) => {
          setTab(value);
          setDetail(undefined);
          setError("");
        }}
      >
        {error && (
          <p role="alert" className="bank-notice bank-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="bank-notice">
            {notice}
          </p>
        )}
        {busy && (
          <p role="status" className="bank-notice">
            <CircleNotch size={16} className="spin" /> {busy}…
          </p>
        )}
        {<HistoricalUpload state={state} showUpload={showUpload} setShowUpload={setShowUpload} procurementId={procurementId} setProcurementId={setProcurementId} busy={busy} upload={upload} />}
        {<HistoricalDocuments state={state} tab={tab} setDraftId={setDraftId} setFunctionName={setFunctionName} setPeriod={setPeriod} />}
        {<HistoricalDraft functionName={functionName} setFunctionName={setFunctionName} period={period} setPeriod={setPeriod} busy={busy} draft={draft} saveDraft={saveDraft} confirmDraft={confirmDraft} publishDraft={publishDraft} />}
        {tab !== "Bantuan Estimasi" && (
          <section className="bank-filters" aria-label="Filter referensi">
            <label className="field">
              Fungsi
              <span className="bank-select">
                <select
                  value={functionFilter}
                  onChange={(e) => setFunctionFilter(e.target.value)}
                >
                  <option value="">Semua fungsi</option>
                  {functions.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <CaretDown size={16} aria-hidden="true" />
              </span>
            </label>
            <label className="field">
              Periode
              <span className="bank-select">
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Semua periode</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
                <CaretDown size={16} aria-hidden="true" />
              </span>
            </label>
            <label className="bank-search">
              <MagnifyingGlass size={17} />
              <input
                aria-label="Cari referensi OE"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari pekerjaan atau nama dokumen…"
              />
            </label>
          </section>
        )}
        {<BankReferences tab={tab} setTab={setTab} selectedIds={selectedIds} setDetail={setDetail} filtered={filtered} selected={selected} toggle={toggle} compareReference={compareReference} />}
        {<ReferenceDetail state={state} detail={detail} setDetail={setDetail} compareReference={compareReference} />}
        {<HistoricalStatistics tab={tab} setTab={setTab} selectedIds={selectedIds} setDetail={setDetail} busy={busy} selected={selected} statistics={statistics} statsReady={statsReady} toggle={toggle} exportStats={exportStats} compareReference={compareReference} />}
        {<HistoricalEstimate tab={tab} setTab={setTab} busy={busy} need={need} setNeed={setNeed} unit={unit} setUnit={setUnit} quantity={quantity} setQuantity={setQuantity} estimate={estimate} selected={selected} createEstimate={createEstimate} />}
      </PageTabs>
    </div>
  );
}
