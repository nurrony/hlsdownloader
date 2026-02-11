/**
 * @module HLSDownloader
 * @description The primary entry point for the HLS Downloader library.
 * Provides access to the core Downloader and supporting service classes.
 */

import HLSDownloader, { DownloaderOptions, DownloadSummary } from './Downloader.js';

export type { DownloaderOptions, DownloadSummary };

/**
 * @namespace HLSDownloader
 * @description Namespace containing all core classes and services.
 */
// Export core classes and singletons
export { HLSDownloader };

// Default export for the main orchestrator
export default HLSDownloader;
