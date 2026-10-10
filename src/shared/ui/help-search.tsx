import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
const Context = createContext({ query: "", setQuery: (_query: string) => { void _query; } });
export const useHelpSearch = () => useContext(Context);
export function HelpSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <Context.Provider value={{ query, setQuery }}>{children}</Context.Provider>;
}
