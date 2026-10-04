import type { ComponentType } from "react";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";
export interface PDPanelProps { procurement: Procurement; ResultView: ComponentType<{ snapshot: Snapshot; procurement: Procurement }>; }
