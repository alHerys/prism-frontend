import type { Preferences } from "../../hea/domain/models";

export interface Procurement {
  id: string;
  name: string;
  number: string;
  functionName: string;
  createdAt: string;
  preferences?: Preferences;
  preferenceRevision: number;
  preferenceConfirmed: boolean;
}

export interface Vendor {
  id: string;
  procurementId: string;
  name: string;
  // Older records did not capture an addition timestamp.
  createdAt?: string;
}
