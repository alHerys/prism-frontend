import type { Procurement } from "../domain/models";
import type { ReactNode } from "react";
export interface ProcurementTableProps { items: Procurement[]; search?: string; onSearchChange?: (value: string) => void; searchLabel?: string; children?: ReactNode; }
