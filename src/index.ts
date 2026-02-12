/**
 * Namespace containing all core classes and services.
 */
import HLSDownloader, { DownloaderOptions, DownloadError, DownloadSummary } from './Downloader.js';

export type { DownloaderOptions, DownloadError, DownloadSummary };

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
