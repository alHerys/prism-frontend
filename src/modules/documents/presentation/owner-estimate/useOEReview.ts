import { useLocation, useNavigate } from "react-router";
import type { DocumentRecord } from "../../domain/models";
import { useDocumentsCommands } from "../binding";
import { spreadsheetReturnTo } from "../spreadsheet/navigation";
import { useSpreadsheetReview } from "../spreadsheet/useSpreadsheetReview";

export function useOEReview(document: DocumentRecord) {
  const commands = useDocumentsCommands();
  const navigate = useNavigate();
  const location = useLocation();
  return useSpreadsheetReview({ document, stored: document.ownerEstimate?.reviewed ?? document.ownerEstimate?.candidate,
    warnings: document.warnings, acknowledged: commands.reviewWorkflow === "SAVE_CONFIRMS" || document.acknowledged,
    save: commands.saveAndConfirmOwnerEstimate, successMessage: commands.reviewWorkflow === "SAVE_CONFIRMS" ? "OE disimpan." : "OE disimpan dan terkonfirmasi.",
    onBack: () => { void navigate(spreadsheetReturnTo(document, location.state?.reviewReturnTo)); },
  });
}
export type OEReviewModel = ReturnType<typeof useOEReview>;
