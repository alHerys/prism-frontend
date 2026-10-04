import type * as React from "react";

export interface HistoryPageModel {
  onOpenResult: ((id: string) => void) | undefined;
  state: { documents: import("../../modules/documents/domain/models").DocumentRecord[]; procurements: import("../../modules/procurement/domain/models").Procurement[]; vendors: import("../../modules/procurement/domain/models").Vendor[]; snapshots: import("../../modules/evaluations/domain/models").Snapshot[]; events: import("../../modules/evaluations/domain/models").Activity[]; };
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  module: string;
  setModule: React.Dispatch<React.SetStateAction<string>>;
  procurement: string;
  setProcurement: React.Dispatch<React.SetStateAction<string>>;
  start: string;
  setStart: React.Dispatch<React.SetStateAction<string>>;
  end: string;
  setEnd: React.Dispatch<React.SetStateAction<string>>;
  selected: import("../../modules/evaluations/domain/models").Snapshot | undefined;
  setSelected: React.Dispatch<React.SetStateAction<import("../../modules/evaluations/domain/models").Snapshot | undefined>>;
  notice: string;
  exportBusy: boolean;
  noticeError: boolean;
  events: import("../../modules/evaluations/domain/models").Activity[];
  results: import("../../modules/evaluations/domain/models").Snapshot[];
  activityChart: [string, number][];
  maxCount: number;
  visibleDocuments: import("../../modules/documents/domain/models").DocumentRecord[];
  procurementName: (id?: string | undefined) => string;
  exportSelected: () => Promise<void>;
}
