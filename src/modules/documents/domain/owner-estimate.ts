// Compatibility names for the OE contract; shared spreadsheet rules stay in one place.
export {
  identifySpreadsheet as identifyOESheet,
  editableSpreadsheetFields as editableOEFields,
  parseSpreadsheetMoney as parseOEMoney,
  spreadsheetInputValue as oeInputValue,
  applySpreadsheetEdits as applyOEEdits,
  spreadsheetIssues as oeIssues,
} from "./spreadsheet";
export type {
  SpreadsheetAmount as OEAmount,
  SpreadsheetRow as OERow,
  SpreadsheetSheet as OESheet,
  SpreadsheetReview as OEReview,
  SpreadsheetEdit as OEEdit,
  SpreadsheetField as OEField,
} from "./spreadsheet";
