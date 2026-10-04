import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import "../../../shared/styles/bank.css";
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <FileXls size={28} />
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}
