import type { Procurement } from "../domain/models";
export interface ProcurementTableProps { items: Procurement[]; search?: string; onSearchChange?: (value: string) => void; searchLabel?: string; }
