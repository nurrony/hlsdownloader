export interface DownloadSummary {
  total: number;
  errors: Array<{ url: string; name: string; message: string }>;
  message: string;
}
