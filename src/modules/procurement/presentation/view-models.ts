import type * as React from "react";

export interface ProcurementTableModel {
  items: import("../domain/models").Procurement[];
  onSearchChange: ((s: string) => void) | undefined;
  searchLabel: string;
  state: import("../application/queries").ProcurementData;
  setOwnSearch: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  ascending: boolean;
  setAscending: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  size: string;
  setSize: React.Dispatch<React.SetStateAction<string>>;
  filtered: import("../domain/models").Procurement[];
  count: number;
  pages: number;
  current: number;
  shown: import("../domain/models").Procurement[];
}

export interface ProcurementListModel {
  state: import("../application/queries").ProcurementData;
  setParams: import("react-router").SetURLSearchParams;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: (value: string) => void;
  form: { name: string; number: string; functionName: string; };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; number: string; functionName: string; }>>;
  busy: boolean;
  create: (e: React.FormEvent<Element>) => Promise<void>;
}
