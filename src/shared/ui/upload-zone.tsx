import { Button } from "./button";
import { UploadSimpleIcon } from "@phosphor-icons/react/dist/csr/UploadSimple";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import "./components.css";

export function UploadZone({
  children,
  onFiles,
  disabled = false,
  ariaLabel = "Pilih dokumen",
  accept,
  multiple = false,
}: {
  children?: ReactNode;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  ariaLabel?: string;
  accept?: string;
  multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const id = useId();
  const receive = (files: FileList | null) => {
    if (!disabled && files?.length) onFiles(Array.from(files));
  };
  return (
    <div
      className={`dropzone upload-zone ${over ? "over" : ""} ${disabled ? "is-disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        receive(event.dataTransfer.files);
      }}
    >
      <UploadSimpleIcon size={30} aria-hidden="true" />
      <div id={id} className="upload-description">
        {children}
      </div>
      <input
        ref={input}
        type="file"
        hidden
        aria-label={ariaLabel}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          receive(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <Button
        onClick={() => input.current?.click()}
        disabled={disabled}
        aria-describedby={children ? id : undefined}
      >
        {ariaLabel}
      </Button>
    </div>
  );
}
