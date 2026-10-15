import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import type { DocumentRecord } from "../../domain/models";
import { useDocumentsCommands } from "../binding";
import { spreadsheetReturnTo } from "../spreadsheet/navigation";
import { useSpreadsheetReview } from "../spreadsheet/useSpreadsheetReview";
import { SpreadsheetReviewPage } from "../spreadsheet/SpreadsheetReviewPage";
import { offerProfile } from "../spreadsheet/profiles";
import { ReviewRemoval } from "../ReviewRemoval";
import "./offer-review.css";

export function OfferSpreadsheetReview({ document }: { document: DocumentRecord }) {
  const commands = useDocumentsCommands();
  const navigate = useNavigate();
  const location = useLocation();
  const source = commands.availableSources().find(s => s.id === document.sourceId);
  const table = document.offerSpreadsheet;
  const path = `/pengadaan/${document.procurementId}`;
  const back = () => { void navigate(spreadsheetReturnTo(document, location.state?.reviewReturnTo)); };
  const model = useSpreadsheetReview({ document, stored: table?.reviewed ?? table?.candidate,
    warnings: table?.candidate.warnings ?? [], acknowledged: commands.reviewWorkflow === "SAVE_CONFIRMS" || (table?.acknowledged ?? false),
    save: commands.saveAndConfirmOfferSpreadsheet, onBack: back, successMessage: commands.reviewWorkflow === "SAVE_CONFIRMS" ? "Spreadsheet penawaran disimpan." : "Spreadsheet penawaran disimpan dan terkonfirmasi.",
  });
  const latest = useRef(document);
  latest.current = document;
  const [removalTarget, setRemovalTarget] = useState<DocumentRecord>();
  const [removalFailure, setRemovalFailure] = useState("");
  const [removing, setRemoving] = useState(false);
  async function remove() {
    if (!removalTarget || removing) return;
    setRemoving(true); setRemovalFailure("");
    try {
      await commands.removeVendorDocument(document.procurementId, removalTarget.id, removalTarget.revision);
      setRemovalTarget(undefined); back();
    } catch (error) { setRemovalFailure(error instanceof Error ? error.message : "Dokumen belum dapat dihapus."); }
    finally { setRemoving(false); }
  }
  return <>
    <SpreadsheetReviewPage model={{ ...model, busy: model.busy || removing }} profile={offerProfile} name={document.name} reviewWorkflow={commands.reviewWorkflow}
      label="Penawaran" editLabel="Edit Penawaran" confirmed={table?.status === "CONFIRMED"} warnings={table?.candidate.warnings ?? []} source={source?.path}
      headerActions={!model.archived && <button className="icon-button review-remove" aria-label="Hapus Penawaran Harga" title="Hapus dokumen" disabled={model.busy || removing}
        onClick={() => model.requestExit(() => { setRemovalFailure(""); setRemovalTarget(latest.current); })}><Trash size={20} aria-hidden="true" /></button>}
      missing={<><h2>Data Jumlah Harga belum tersedia</h2><p>Baca ulang XLSX penawaran untuk menampilkan tabel lengkap. Harga satuan tidak diubah menjadi Jumlah Harga.</p><Link className="btn" to={`${path}?tab=ringkasan&vendor=${encodeURIComponent(document.vendorId ?? "")}`}>Kembali ke dokumen vendor</Link></>} />
    <ReviewRemoval removalTarget={removalTarget} removalFailure={removalFailure} busy={removing} cancelRemoval={() => { if (!removing) setRemovalTarget(undefined); }} removeDocument={remove} />
  </>;
}
