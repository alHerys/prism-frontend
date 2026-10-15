import { Link } from "react-router";
import type { DocumentRecord } from "../../domain/models";
import { useDocumentsCommands } from "../binding";
import { useOEReview } from "./useOEReview";
import { SpreadsheetReviewPage } from "../spreadsheet/SpreadsheetReviewPage";
import { oeProfile } from "../spreadsheet/profiles";
export function OwnerEstimateReview({ document }: { document: DocumentRecord }) {
  const model = useOEReview(document);
  const commands = useDocumentsCommands();
  const source = commands.availableSources().find(source => source.id === document.sourceId);
  return <SpreadsheetReviewPage model={model} profile={oeProfile} name={document.name} label="OE" editLabel="Edit OE"
    confirmed={document.status === "CONFIRMED"} warnings={document.warnings} source={source?.path} reviewWorkflow={commands.reviewWorkflow}
    missing={<><h2>Data Jumlah Harga belum tersedia</h2><p>Dokumen lama hanya memiliki harga satuan. Unggah ulang XLSX OE untuk membaca struktur lengkap.</p><Link className="btn" to={`/pengadaan/${document.procurementId}?tab=ringkasan`}>Kembali ke dokumen OE</Link></>} />;
}
