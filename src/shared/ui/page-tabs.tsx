import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import "./components.css";

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
