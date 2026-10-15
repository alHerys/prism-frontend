import type { A5Values } from "../../documents/domain/models";
import type { ResultRow } from "../../evaluations/domain/models";
import type { Preferences } from "../domain/models";

export interface HEACalculationInput {
  vendorId: string;
  vendorName: string;
  source: string;
  values: A5Values;
}

export interface HEACalculator {
  evaluate(inputs: readonly HEACalculationInput[], preferences: Preferences): ResultRow[];
}
