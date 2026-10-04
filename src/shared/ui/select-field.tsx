import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretUpIcon } from "@phosphor-icons/react/dist/csr/CaretUp";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import * as Select from "@radix-ui/react-select";
import "./components.css";

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
