import { cpus } from 'node:os';
import pLimit, { LimitFunction } from 'p-limit';
import FileService from './services/FileWriter.js';
import HttpClient from './services/HttpClient.js';
import PlaylistParser from './services/PlaylistParser.js';
import { Utils } from './Utils.js';

export interface DownloaderOptions {
  playlistURL: string;
  destination?: string;
  overwrite?: boolean;
  concurrency?: number;
  // eslint-disable-next-line no-unused-vars
  onData?: (data: { url: string; path?: string; total: number }) => void;
  // eslint-disable-next-line no-unused-vars
  onError?: (error: { url: string; name: string; message: string }) => void;
  [key: string]: any; // For kyOptions
}

export interface DownloadSummary {
  total: number;
  errors: Array<{ url: string; name: string; message: string }>;
  message: string;
}

/**
 * @class Downloader
 * @description Main orchestrator that coordinates fetching, parsing, and downloading HLS content.
 */
class Downloader {
  private playlistURL: string;
  private onData: DownloaderOptions['onData'];
  private onError: DownloaderOptions['onError'];
  private pool: LimitFunction;
  private http: HttpClient;
  private fileService: FileService;
  private items: string[];
  private errors: DownloadSummary['errors'] = [];

  constructor(options: DownloaderOptions) {
    const {
      onData,
      onError,
      destination = '',
      playlistURL = '',
      overwrite = false,
      concurrency = Math.max(1, cpus().length - 1),
      ...kyOptions
    } = options || {};

    this.onData = onData;
    this.onError = onError;
    this.playlistURL = playlistURL;
    this.pool = pLimit(concurrency);

    this.http = new HttpClient(kyOptions);
    this.fileService = new FileService(destination, overwrite);

    this.items = [playlistURL];
  }

  async startDownload(): Promise<DownloadSummary> {
    try {
      Utils.isValidUrl(this.playlistURL);

      const mainContent = await this.http.fetchText(this.playlistURL);
      const urls = PlaylistParser.parse(this.playlistURL, mainContent);
      this.items.push(...urls);

      const variantPlaylists = urls.filter(u => PlaylistParser.isPlaylist(u));
      const variantResults = await Promise.allSettled(variantPlaylists.map(u => this.http.fetchText(u)));

      variantResults.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          const subUrls = PlaylistParser.parse(variantPlaylists[index], res.value);
          this.items.push(...subUrls);
        }
      });

      await this.processQueue();

      return this.generateSummary();
    } catch (error: any) {
      this.handleError(this.playlistURL, error);
      return this.generateSummary();
    }
  }

  private async processQueue(): Promise<any> {
    if (this.fileService['destination']) {
      if (!(await this.fileService.canWrite(this.playlistURL))) {
        throw new Error('Directory already exists and overwrite is disabled');
      }
      const tasks = this.items.map(url => this.pool(() => this.downloadFile(url)));
      return Promise.allSettled(tasks);
    }

    const fetchTasks = this.items.map(url =>
      this.pool(async () => {
        try {
          const content = await this.http.getStream(url);
          if (this.onData) {
            this.onData({ url, total: this.items.length });
          }
          return content;
        } catch (error: any) {
          this.handleError(url, error);
        }
      })
    );
    return Promise.allSettled(fetchTasks);
  }

  private async downloadFile(url: string): Promise<void> {
    try {
      const stream = await this.http.getStream(url);
      const path = await this.fileService.prepareDirectory(url);
      await this.fileService.saveStream(stream, path);

      if (this.onData) {
        this.onData({ url, path, total: this.items.length });
      }
    } catch (error: any) {
      this.handleError(url, error);
    }
  }

  private handleError(url: string, error: Error): void {
    const errorData = { url, name: error.name, message: error.message };
    this.errors.push(errorData);
    if (this.onError) {
      this.onError(errorData);
    }
  }

  private generateSummary(): DownloadSummary {
    return {
      total: this.items.length,
      errors: this.errors,
      message: this.errors.length > 0 ? 'Download ended with some errors' : 'Downloaded successfully',
    };
  }
}

export default Downloader;
