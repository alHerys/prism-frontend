import { parseDetailTables } from "../spreadsheet/detail-tables";
export const parseOwnerEstimate = (bytes: ArrayBuffer) => parseDetailTables(bytes, "OE");
