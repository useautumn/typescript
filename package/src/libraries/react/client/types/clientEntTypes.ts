export interface CreateEntityParams {
  id: string;
  name: string;
  featureId: string;
}

export interface GetEntityParams {
  expand?: string[];
}
