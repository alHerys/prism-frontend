import type * as React from "react";

export interface HEAPanelModel {
  p: import("../../procurement/domain/models").Procurement;
  state: import("../application/queries").HEAData;
  docs: import("../../documents/domain/models").DocumentRecord[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  prefs: { barang: string; jasa: string; };
  setPrefs: React.Dispatch<React.SetStateAction<{ barang: string; jasa: string; }>>;
  busy: boolean;
  prefDirty: boolean;
  chosen: import("../../evaluations/domain/models").Snapshot | undefined;
  save: () => Promise<void>;
  confirm: () => Promise<void>;
  evaluate: () => Promise<void>;
}
