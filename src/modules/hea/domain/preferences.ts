import type { Preferences } from "./models";
import { copy, decimal, DomainError, equalValues } from "../../../shared/kernel/validation";
interface PreferenceState { preferences?: Preferences; preferenceRevision: number; preferenceConfirmed: boolean; }
export function reviewedPreferences(current: PreferenceState, values: Preferences): PreferenceState | undefined {
  for (const key of ["preferensi_barang", "preferensi_jasa"] as const) decimal(values[key], true);
  if (current.preferences && equalValues(values, current.preferences)) return undefined;
  return { preferences: copy(values), preferenceRevision: current.preferenceRevision + 1, preferenceConfirmed: false };
}
export function confirmedPreferences(current: PreferenceState): PreferenceState | undefined {
  if (!current.preferences) throw new DomainError("PREFERENCES_REQUIRED", "Isi preferensi barang dan jasa.");
  if (current.preferenceConfirmed) return undefined;
  return { ...current, preferenceConfirmed: true };
}
