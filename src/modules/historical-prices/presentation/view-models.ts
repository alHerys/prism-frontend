import type * as React from "react";

export interface BankPageModel {
  state: import("../application/queries").HistoricalPricesData;
  showUpload: boolean;
  setShowUpload: React.Dispatch<React.SetStateAction<boolean>>;
  setDraftId: React.Dispatch<React.SetStateAction<string>>;
  functionName: string;
  setFunctionName: React.Dispatch<React.SetStateAction<string>>;
  period: string;
  setPeriod: React.Dispatch<React.SetStateAction<string>>;
  procurementId: string;
  setProcurementId: React.Dispatch<React.SetStateAction<string>>;
  busy: string;
  notice: string;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  need: string;
  setNeed: React.Dispatch<React.SetStateAction<string>>;
  units: string[];
  unit: string;
  setUnit: React.Dispatch<React.SetStateAction<string>>;
  quantity: string;
  setQuantity: React.Dispatch<React.SetStateAction<string>>;
  draft: import("../../documents/domain/models").DocumentRecord | undefined;
  estimate: import("../domain/models").Estimate | undefined;
  selected: import("../domain/models").HistoricalItem[];
  upload: (file?: File | undefined) => Promise<void>;
  saveDraft: () => Promise<void>;
  confirmDraft: () => Promise<void>;
  publishDraft: () => Promise<void>;
  createEstimate: () => Promise<void>;
}
