import type * as React from "react";

export interface UploadPanelModel {
  oeChoice: import("../application/owner-estimate-ports").PreparedOE | undefined;
  chooseOESheet: (id: string) => Promise<void>;
  cancelOEImport: () => void;
  removalTarget: import("../domain/models").DocumentRecord | undefined;
  removalFailure: string;
  requestRemoval: () => void;
  cancelRemoval: () => void;
  removeOwnerEstimate: () => Promise<void>;
  currentDocument: import("../domain/models").DocumentRecord | undefined;
  replacing: boolean;
  beginReplacement: () => void;
  cancelReplacement: () => void;
  scope: "procurement" | "vendor";
  embedded: boolean;
  kind: import("../domain/models").DocumentKind;
  setKind: React.Dispatch<React.SetStateAction<import("../domain/models").DocumentKind>>;
  busy: boolean;
  processing: string;
  failure: string;
  upload: (file: File) => Promise<void>;
}

export interface ReviewModel {
  removalTarget: import("../domain/models").DocumentRecord | undefined;
  removalFailure: string;
  requestRemoval: () => void;
  cancelRemoval: () => void;
  removeDocument: () => Promise<void>;
  id: string | undefined;
  state: import("../application/queries").DocumentsData;
  d: import("../domain/models").DocumentRecord | undefined;
  showSource: boolean;
  setShowSource: React.Dispatch<React.SetStateAction<boolean>>;
  ack: boolean;
  setAck: React.Dispatch<React.SetStateAction<boolean>>;
  busy: boolean;
  confirm: boolean;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  leave: boolean;
  setLeave: React.Dispatch<React.SetStateAction<boolean>>;
  focused: string;
  setFocused: React.Dispatch<React.SetStateAction<string>>;
  values: import("../domain/models").A5Values | undefined;
  pairs: import("../../price-deviation/domain/models").PricePair[];
  group: string;
  setGroup: React.Dispatch<React.SetStateAction<string>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  failure: string;
  blocker: import("react-router").Blocker;
  leavePage: () => void;
  p: import("../../procurement/domain/models").Procurement;
  vendor: import("../../procurement/domain/models").Vendor | undefined;
  source: import("../application/ports").DocumentSource | undefined;
  back: () => void | Promise<void>;
  changeValue: (key: keyof import("../domain/models").A5Values, value: string) => void;
  save: () => Promise<boolean>;
  confirmDocument: () => Promise<void>;
  editPair: (index: number, key: "oe" | "offer" | "matched", value: string | boolean) => void;
}
