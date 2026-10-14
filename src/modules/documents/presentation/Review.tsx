import { ReviewView } from "./ReviewView";
import { useReview } from "./useReview";
import { useParams } from "react-router";
import { useDocumentsData } from "./binding";
import { OwnerEstimateReview } from "./owner-estimate/OwnerEstimateReview";
export function Review() {
  const { id, documentId } = useParams();
  const data = useDocumentsData();
  const document = data.documents.find(d => d.id === documentId && d.procurementId === id);
  return document?.kind === "OE" ? <OwnerEstimateReview key={document.id} document={document} /> : <DocumentReview />;
}
function DocumentReview() {
  const model = useReview();
  return <ReviewView {...model} />;
}
