export interface PDPanelModel {
  p: import("../../procurement/domain/models").Procurement;
  chosen: import("../../evaluations/domain/models").Snapshot | undefined;
}
