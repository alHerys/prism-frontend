import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react/dist/csr/X";

import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { Badge, EmptyState } from "./components";
import { demoService } from "./domain";
export const useDemo = () =>
  useSyncExternalStore(demoService.subscribe, demoService.getState);
export const money = (s: string | undefined) => {
  if (!s) return "—";
  const [whole, fraction] = s.split(".");
  try {
    return (
      "Rp" +
      BigInt(whole).toLocaleString("id-ID") +
      (fraction ? "," + fraction : "")
    );
  } catch {
    return s;
  }
};
export const roundedMoney = (s: string | undefined) => {
  if (!s) return "—";
  const [whole, fraction = ""] = s.split(".");
  return money(
    (BigInt(whole) + (fraction[0] && fraction[0] >= "5" ? 1n : 0n)).toString(),
  );
};
export const pct = (s: string) => {
  const [w, f = ""] = s.split(".");
  const digits = w + f.padEnd(2, "0");
  const idx = digits.length - Math.max(0, f.length - 2);
  return `${digits.slice(0, idx).replace(/^0+(?=\d)/, "") || "0"}${digits.slice(idx).replace(/0+$/, "") ? "," + digits.slice(idx).replace(/0+$/, "") : ""}%`;
};
export const date = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const dateTime = (s: string) =>
  new Date(s).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
export const kindLabel: Record<string, string> = {
  FORM_A5: "Form A5",
  OE: "Owner Estimate",
  OFFER: "Penawaran vendor",
  HISTORICAL_OE: "OE historis",
};
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
  () => {},
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
