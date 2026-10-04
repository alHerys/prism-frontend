import type { ButtonHTMLAttributes } from "react";
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
