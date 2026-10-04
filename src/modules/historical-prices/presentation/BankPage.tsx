import "./bank-page.types.ts";
import { BankPageView } from "./BankPageView";
import { useBankPage } from "./useBankPage";
export function BankPage() {
  const model = useBankPage();
  return <BankPageView {...model} />;
}

export default BankPage;
