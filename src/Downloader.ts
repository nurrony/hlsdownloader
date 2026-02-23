import { cpus } from 'node:os';
import pLimit, { LimitFunction } from 'p-limit';
import { Utils } from './HLSUtils.js';
import FileService from './services/FileWriter.js';
import HttpClient from './services/HttpClient.js';
import PlaylistParser from './services/PlaylistParser.js';

/**
 * @category Types
 * Represents a failed segment or playlist download attempt.
 */
interface DownloadError {
  /** The full URL of the resource that failed to download. */
  url: string;

  /** The error class name (e.g., 'HTTPError', 'TimeoutError'). */
  name: string;

  /** The descriptive error message provided by the network client or parser. */
  message: string;
}

/**
 * @category Types
 * Metadata describing a successfully downloaded HLS media segment.
 */
interface SegmentDownloadedData {
  /**
   * The original segment URL as referenced in the HLS playlist (.m3u8).
   */
  url: string;

  /**
   * Absolute or relative local file system path where the segment
   * was saved. Undefined if the segment was kept in memory.
   */
  path?: string;

  /**
   * Total number of segments download.
   */
  total: number;
}

/**
 * Information about a failed HLS segment download.
 */
interface SegmentDownloadErrorData {
  /**
   * The original segment URL as referenced in the HLS playlist (.m3u8).
   */
  url: string;

  /**
   * The error name or type (e.g., network error, timeout, aborted).
   */
  name: string;

  /**
   * Human-readable description of the failure.
   */
  message: string;
}
/**
 * @category Types
 * Configuration contract for {@link Downloader}.
 */
interface DownloaderOptions {
  /**
   * The absolute URL to the master or variant .m3u8 playlist.
   */
  playlistURL: string;

  /**
   * The local directory where files will be saved.
   * If omitted, the downloader runs in 'dry-run' mode.
   * @default ""
   */
  destination?: string;

  /**
   * Indicates whether existing files should be overwritten.
   * @default false
   */
  overwrite?: boolean;

  /**
   * Maximum number of simultaneous network requests.
   * @default (CPU_CORES - 1)
   */
  concurrency?: number;

  /** Callback invoked when a segment downloaded successfully.*/
  onData?: (data: SegmentDownloadedData) => void;

  /** Callback invoked when a segment fails to download. */
  onError?: (error: SegmentDownloadErrorData) => void;

  /**  Optional HTTP client configuration */
  [key: string]: any; // For kyOptions
}

/**
 * @category Types
 * Final execution report returned by {@link Downloader.startDownload}.
 */
interface DownloadSummary {
  /**  Total number of processed segments.*/
  total: number;

  /** An array of errors encountered during the process. */
  errors: DownloadError[];

  /**  Human-readable completion status.*/
  message: string;
}

/**
 * @category
 * @author Nur Rony<pro.nmrony@gmail.com>
 * The main orchestrator service for managing HLS stream acquisition.
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
  private concurrency = 1;

  /**
   * Creates a new Downloader instance.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @param options - Configuration object.
   * @param options.playlistURL - URL of the master HLS playlist.
   * @param [options.destination] - Output directory for downloaded files.
   * @param [options.overwrite] - Whether to overwrite existing files.
   * @param [options.concurrency] - Maximum concurrent downloads.
   * @param [options.onData] - Callback triggered on successful segment retrieval.
   * @param [options.onError] - Callback triggered on failure.
   */
  constructor(private options: DownloaderOptions) {
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
    this.concurrency = concurrency;

    this.http = new HttpClient(kyOptions);
    this.fileService = new FileService(destination, overwrite);

    this.items = [playlistURL];
  }

  /**
   * Initiates the download lifecycle.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @returns - {Promise<DownloadSummary>} {@link DownloadSummary}
   */
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

  /**
   * Processes all queued URLs using controlled concurrency.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @returns -  Promise<any | unknow>
   */
  private async processQueue(): Promise<any | unknown> {
    const total = this.items.length;

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
            this.onData({ url, total });
          }
          return content;
        } catch (error: any) {
          this.handleError(url, error);
        }
      })
    );
    return Promise.allSettled(fetchTasks);
  }

  /**
   * Downloads and saves a single file.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @param url - Resource URL to download.
   * @returns -
   */
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

  /**
   * Handles and aggregates download errors.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @param url - URL that caused the error.
   * @param error - The thrown error.
   */
  private handleError(url: string, error: Error): void {
    const errorData = { url, name: error.name, message: error.message };
    this.errors.push(errorData);
    if (this.onError) {
      this.onError(errorData);
    }
  }

  /**
   * Generates a structured summary of the download operation.
   * @author Nur Rony<pro.nmrony@gmail.com>
   * @returns - {@link DownloadSummary}
   */
  private generateSummary(): DownloadSummary {
    return {
      errors: this.errors,
      total: this.items.length,
      message: this.errors.length > 0 ? 'Download ended with errors' : 'Downloaded successfully',
    };
  }
}

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Downloads or fetch HLS Playlist and its items
 */
export default Downloader;

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * Types for Downloader
 */
export { DownloaderOptions, DownloadError, DownloadSummary, SegmentDownloadedData, SegmentDownloadErrorData };
