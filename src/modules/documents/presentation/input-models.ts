export interface UploadPanelProps {
  procurementId: string;
  vendorId?: string;
  scope?: "vendor" | "procurement";
  embedded?: boolean;
}
