import { createContext, use, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { ReadStore } from "../kernel/read-store";
export function createModuleBinding<Commands, Data>(name: string) {
  const Context = createContext<{ commands: Commands; queries: ReadStore<Data> } | null>(null);
  function Provider({ value, children }: { value: { commands: Commands; queries: ReadStore<Data> }; children: ReactNode }) {
    return <Context value={value}>{children}</Context>;
  }
  function useCommands() {
    const value = use(Context);
    if (!value) throw new Error(name + "Provider is required.");
    return value.commands;
  }
  function useData() {
    const value = use(Context);
    if (!value) throw new Error(name + "Provider is required.");
    return useSyncExternalStore(value.queries.subscribe, value.queries.getSnapshot);
  }
  return { Provider, useCommands, useData };
}
