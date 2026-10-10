import { dateTime } from "../formatting/display";
import { useWorkspacePreferences } from "./workspace-preferences";
export function useWorkspaceTime() {
  const { preferences } = useWorkspacePreferences();
  return (value: string) => dateTime(value, preferences.profile.timeZone);
}
