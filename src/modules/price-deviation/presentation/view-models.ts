import type * as React from "react";

export interface PDPanelModel {
  p: import("../../procurement/domain/models").Procurement;
  docs: import("../../documents/domain/models").DocumentRecord[];
  oe: string;
  setOe: React.Dispatch<React.SetStateAction<string>>;
  offer: string;
  setOffer: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
  chosen: import("../../evaluations/domain/models").Snapshot | undefined;
  evaluate: () => Promise<void>;
}
