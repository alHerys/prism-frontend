import { CircleNotchIcon } from "@phosphor-icons/react/dist/csr/CircleNotch";
import "./components.css";

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
