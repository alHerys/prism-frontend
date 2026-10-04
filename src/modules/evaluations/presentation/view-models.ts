import type * as React from "react";

export interface ResultPanelModel {
  s: import("../domain/models").Snapshot;
  p: import("../../procurement/domain/models").Procurement;
  busy: boolean;
  detail: boolean;
  setDetail: React.Dispatch<React.SetStateAction<boolean>>;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  exportResult: () => Promise<void>;
  rows: import("../domain/models").ResultRow[];
}
