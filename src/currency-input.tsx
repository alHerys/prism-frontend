import type { InputHTMLAttributes } from "react";

function formatAmount(value: string) {
  const match = /^(-?\d*)(?:\.(\d*))?$/.exec(value);
  if (!match) return value;
  const whole = match[1].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return whole + (match[2] === undefined ? "" : `,${match[2]}`);
}

export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="currency-input">
      <span aria-hidden="true">Rp</span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={formatAmount(value)}
        onChange={(event) => {
          const input = event.currentTarget;
          const text = input.value;
          const offset = text.slice(0, input.selectionStart ?? text.length).replaceAll(".", "").length;
          const raw = text.replaceAll(".", "").replace(",", ".");
          onValueChange(raw);
          requestAnimationFrame(() => {
            if (document.activeElement !== input) return;
            let position = 0;
            let count = 0;
            while (position < input.value.length && count < offset) {
              if (input.value[position] !== ".") count++;
              position++;
            }
            input.setSelectionRange(position, position);
          });
        }}
      />
    </div>
  );
}
