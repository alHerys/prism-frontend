import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import "../../shared/styles/bank.css";
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Clock size={26} />
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}
