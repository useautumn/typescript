export interface CreateEntityParams {
  id: string;
  name: string;
  feature_id: string;
}

export interface CreateEntityResult {
  success: boolean;
}

export interface DeleteEntityResult {
  success: boolean;
}
