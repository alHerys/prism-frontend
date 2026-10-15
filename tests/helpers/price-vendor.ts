import type { Page } from "@playwright/test";
export async function selectPriceVendor(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Vendor Harga Timpang", exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
