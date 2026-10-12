import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useId, useRef } from "react";

export function Modal({
  className,
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  className?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  const descriptionId = useId();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal${className ? ` ${className}` : ""}`}
          aria-describedby={description ? descriptionId : undefined}
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
          {description && <Dialog.Description id={descriptionId} asChild>
            <p>{description}</p>
          </Dialog.Description>}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
