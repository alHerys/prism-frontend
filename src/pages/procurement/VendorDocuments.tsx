import { Navigate, useParams } from "react-router";

// Keep existing bookmarks and review return links usable after retiring the page.
export function VendorDocuments() {
  const { id, vendorId } = useParams();
  return <Navigate replace to={`/pengadaan/${id}?tab=ringkasan&vendor=${encodeURIComponent(vendorId ?? "")}`} />;
}
