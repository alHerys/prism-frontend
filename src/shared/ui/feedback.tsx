import { X } from "@phosphor-icons/react/dist/csr/X";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { Badge, EmptyState } from "./components";
export function Status({ value }: { value: string }) {
  const confirmed = value === "CONFIRMED" || value === "COMPLETE";
  return (
    <Badge tone={confirmed ? "success" : "warning"}>
      {confirmed
        ? value === "COMPLETE"
          ? "Lengkap"
          : "Terkonfirmasi"
        : value === "PARTIAL"
          ? "Hasil parsial"
          : "Perlu ditinjau"}
    </Badge>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return <EmptyState title={title}>{children}</EmptyState>;
}
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => { },
);
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
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
      value={(message, error = false) => setToast({ message, error })}
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
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          onOpenAutoFocus={() => {
            opener.current = document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
        >
          <Dialog.Title asChild>
            <h2>{title}</h2>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p>{description}</p>
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Stepper({ stage }: { stage: number }) {
  return (
    <nav className="stepper" aria-label="Progres evaluasi">
      {["Dokumen", "Review", "Konfirmasi", "Evaluasi", "Hasil"].map((x, i) => (
        <div
          key={x}
          className={`step ${i < stage ? "done" : i === stage ? "current" : ""}`}
          aria-current={i === stage ? "step" : undefined}
        >
          <i>{i < stage ? <Check size={13} /> : i + 1}</i>
          {x}
        </div>
      ))}
    </nav>
  );
}
