import { BankPageView } from "./BankPageView";
import { useBankPage } from "./useBankPage";
export function BankPage(props: Parameters<typeof useBankPage>[0]) {
  const model = useBankPage(props);
  return <BankPageView {...model} />;
}

export default BankPage;
export type { BankPageProps } from "./bank-page.types.ts";
