export type MaterialStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface Material {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  status: MaterialStatus;
  created_at: string;
}
