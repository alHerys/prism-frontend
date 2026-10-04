import "../../../shared/styles/bank.css";
import { BankPageView } from "./BankPageView";
import { useBankPage } from "./useBankPage";
export function BankPage() {
  const model = useBankPage();
  return <BankPageView {...model} />;
}

export default BankPage;
