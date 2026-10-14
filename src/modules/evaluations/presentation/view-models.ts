import type * as React from "react";

export interface ResultPanelModel {
  s: import("../domain/models").Snapshot;
  p: import("../../procurement/domain/models").Procurement;
  busy: boolean;
  detail: boolean;
  setDetail: React.Dispatch<React.SetStateAction<boolean>>;
  exportResult: () => Promise<void>;
}
