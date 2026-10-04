import { Button } from "./button";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import "./components.css";

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
