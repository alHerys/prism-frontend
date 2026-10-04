import { Badge } from "./badge";

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
