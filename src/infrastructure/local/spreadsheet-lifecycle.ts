export interface SpreadsheetLifecycle {
  saved?: (documentId: string) => void;
  published?: (documentId: string) => void;
}
