import { X } from "@phosphor-icons/react/dist/csr/X";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useWorkspacePreferences } from "./workspace-preferences";
import type { NotificationCategory } from "../kernel/workspace-preferences";

const ToastContext = createContext<(message: string, error?: boolean, category?: NotificationCategory) => void>(
  () => { },
);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { shouldNotify } = useWorkspacePreferences();
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  useEffect(() => {
    if (!toast || toast.error) return;
    const timer = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(message, error = false, category) => {
        if (error || !category || shouldNotify(category)) setToast({ message, error });
      }}
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.message}
          <button
            aria-label="Tutup pemberitahuan"
            onClick={() => setToast(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
