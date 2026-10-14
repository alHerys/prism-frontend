import { ReviewView } from "./ReviewView";
import { useReview } from "./useReview";
import { useLocation, useParams } from "react-router";
import { useDocumentsData } from "./binding";
import { OwnerEstimateReview } from "./owner-estimate/OwnerEstimateReview";
import { OfferSpreadsheetReview } from "./offer/OfferSpreadsheetReview";
export function Review() {
  const { id, documentId } = useParams();
  const data = useDocumentsData();
  const document = data.documents.find(d => d.id === documentId && d.procurementId === id);
  const location = useLocation();
  if (document?.kind === "OFFER" && new URLSearchParams(location.search).get("view") !== "pairs") return <OfferSpreadsheetReview key={document.id} document={document} />;
  return document?.kind === "OE" ? <OwnerEstimateReview key={document.id} document={document} /> : <DocumentReview />;
}
function DocumentReview() {
  const model = useReview();
  return <ReviewView {...model} />;
}
