export interface DashboardModel {
  state: import("../../modules/procurement/application/queries").ProcurementData;
  pending: import("../../modules/documents/domain/models").DocumentRecord[];
}
