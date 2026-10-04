import { useParams } from "react-router";
import "../../shared/styles/focus.css";
import { useSessionState } from "../../services/session-context";

export function useVendorDocuments() {
  const { id, vendorId } = useParams();
  const state = useSessionState();
  const procurement = state.procurements.find((p) => p.id === id);
  const vendor = state.vendors.find((v) => v.id === vendorId && v.procurementId === id);
  const backUrl = `/pengadaan/${id}?tab=dokumen`;
  return { id, vendorId, state, procurement, vendor, backUrl };
}
