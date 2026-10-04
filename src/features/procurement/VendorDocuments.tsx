import { useVendorDocuments } from "./useVendorDocuments";
import { VendorDocumentsView } from "./VendorDocumentsView";
export function VendorDocuments() {
  const model = useVendorDocuments();
  return <VendorDocumentsView {...model} />;
}
