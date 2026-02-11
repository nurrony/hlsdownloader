export interface DownloaderOptions {
  playlistURL: string;
  destination?: string;
  overwrite?: boolean;
  concurrency?: number;
  onData?: (data: { url: string; path?: string; total: number }) => void;
  onError?: (error: { url: string; name: string; message: string }) => void;
  [key: string]: any; // For kyOptions
}
