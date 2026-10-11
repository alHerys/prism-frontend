import { Calculator } from "@phosphor-icons/react/dist/csr/Calculator";
import { ChartBar } from "@phosphor-icons/react/dist/csr/ChartBar";
import { ChartLine } from "@phosphor-icons/react/dist/csr/ChartLine";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FolderPlus } from "@phosphor-icons/react/dist/csr/FolderPlus";
import { Folders } from "@phosphor-icons/react/dist/csr/Folders";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/csr/PencilSimpleLine";
import { Scales } from "@phosphor-icons/react/dist/csr/Scales";
import { SlidersHorizontal } from "@phosphor-icons/react/dist/csr/SlidersHorizontal";
import { UploadSimple } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { UserPlus } from "@phosphor-icons/react/dist/csr/UserPlus";

const actionIcons = {
  CREATED: FolderPlus,
  VENDOR_ADDED: UserPlus,
  UPLOADED: UploadSimple,
  CORRECTED: PencilSimpleLine,
  CONFIRMED: CheckCircle,
  PUBLISHED: Database,
  ESTIMATED: Calculator,
  EXPORTED: DownloadSimple,
  PREFERENCES_UPDATED: SlidersHorizontal,
  PREFERENCES_CONFIRMED: CheckCircle,
  METADATA_UPDATED: PencilSimpleLine,
  GROUP_SELECTED: Folders,
};
const moduleIcons = { HEA: Scales, PRICE_DEVIATION: ChartBar, BANK: ChartLine, PROCUREMENT: FolderPlus };

export function ActivityIcon({ event, size = 21 }: { event: { type: string; module: string }; size?: number }) {
  const Icon = actionIcons[event.type as keyof typeof actionIcons] ?? moduleIcons[event.module as keyof typeof moduleIcons] ?? FolderPlus;
  return <Icon size={size} aria-hidden="true" />;
}

