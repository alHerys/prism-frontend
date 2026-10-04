import type { VendorDocumentsModel } from "./view-models";
import { useParams } from "react-router";
import { useProcurementData } from "../../modules/procurement/presentation/binding";

export function useVendorDocuments() : VendorDocumentsModel {
  const { id, vendorId } = useParams();
  const state = useProcurementData();
  const procurement = state.procurements.find((p) => p.id === id);
  const vendor = state.vendors.find((v) => v.id === vendorId && v.procurementId === id);
  const backUrl = `/pengadaan/${id}?tab=dokumen`;
  return { id, vendorId, state, procurement, vendor, backUrl };
}
