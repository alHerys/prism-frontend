import { useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Select from "@radix-ui/react-select";
import * as Tooltip from "@radix-ui/react-tooltip";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretUpIcon } from "@phosphor-icons/react/dist/csr/CaretUp";
import { UploadSimpleIcon } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/csr/CircleNotch";
import "./components.css";

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
}) {
  return (
    <button
      type={type}
      className={`btn ${variant === "secondary" ? "" : variant} ${className}`}
      {...props}
    />
  );
}
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "error" | "info";
  children: ReactNode;
}) {
  return (
    <span className={`badge ${tone === "neutral" ? "" : tone}`}>
      {children}
    </span>
  );
}
export function Field({
  label,
  htmlFor,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="field-help" id={`${htmlFor}-help`}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
export interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
}
export function PageTabs({
  items,
  value,
  onValueChange,
  ariaLabel,
  children,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  children?: ReactNode;
}) {
  return (
    <Tabs.Root
      className="page-tabs-root"
      value={value}
      onValueChange={onValueChange}
      activationMode="manual"
    >
      <Tabs.List className="tabs page-tabs" aria-label={ariaLabel}>
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={item.value === value ? "active" : ""}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children !== undefined ? (
        <Tabs.Content key={value} value={value} className="page-tab-content">
          {children}
        </Tabs.Content>
      ) : null}
    </Tabs.Root>
  );
}
export function SelectField({
  items,
  value,
  onValueChange,
  ariaLabel,
  placeholder = "Pilih",
  disabled,
  id,
}: {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Select.Trigger id={id} className="select-trigger" aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <CaretDownIcon size={16} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="select-content"
          position="popper"
          sideOffset={5}
        >
          <Select.ScrollUpButton className="select-scroll">
            <CaretUpIcon size={16} />
          </Select.ScrollUpButton>
          <Select.Viewport>
            {items
              .filter((item) => item.value !== "")
              .map((item) => (
                <Select.Item
                  className="select-item"
                  value={item.value}
                  key={item.value}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <CheckIcon size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="select-scroll">
            <CaretDownIcon size={16} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
export function Hint({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={350}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="hint-content" sideOffset={8}>
            {label}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar table-toolbar">{children}</div>;
}
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
export function SourcePanel({
  title,
  children,
  id,
  className = "",
  action,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`source-panel component-source-panel ${className}`}
      aria-label={title}
    >
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderOpenIcon aria-hidden="true" />
      <h3>{title}</h3>
      <div className="empty-copy">{children}</div>
    </div>
  );
}
export function LoadingState({ label }: { label: string }) {
  return (
    <div className="loading-state" role="status">
      <CircleNotchIcon
        className="loading-indicator"
        size={20}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state">
      <div role="alert">
        <WarningCircleIcon size={20} aria-hidden="true" />
        <p>{message}</p>
      </div>
      {onRetry ? <Button onClick={onRetry}>Coba lagi</Button> : null}
    </div>
  );
}
