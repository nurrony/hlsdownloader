/**
 * Namespace containing all core classes and services.
 */
import HLSDownloader, {
  DownloaderEvents,
  DownloaderOptions,
  DownloadError,
  DownloadSummary,
  SegmentDownloadedData,
  SegmentDownloadErrorData,
} from './Downloader.js';

import type { HttpClientOptions } from './services/HttpClient.js';

export type {
  DownloaderEvents,
  DownloaderOptions,
  DownloadError,
  DownloadSummary,
  HttpClientOptions,
  SegmentDownloadedData,
  SegmentDownloadErrorData,
};

/**
 * The primary entry point for the HLS Downloader library.
 * Provides access to the core Downloader and supporting service classes.
 */
// Export core classes and singletons
export { HLSDownloader };

/**
 * The primary entry point for the HLS Downloader library.
 * Provides access to the core Downloader and supporting service classes.
 */
export default HLSDownloader;
