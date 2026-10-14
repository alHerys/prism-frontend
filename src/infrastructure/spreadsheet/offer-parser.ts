import { parseDetailTables } from "./detail-tables";
export const parseOfferSpreadsheet = (bytes: ArrayBuffer) => parseDetailTables(bytes, "OFFER");
