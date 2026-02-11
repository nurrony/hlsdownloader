/**
 * HLS Downloader Entry Point
 * @module HLSDownloader
 */

import * as HLSDownloader from './Downloader.js';

// Export types for consumers
export type { DownloaderOptions } from './types/DownloaderOptions.js';
export type { DownloadSummary } from './types/DownloadSummary.js';

// Export core classes and singletons
export { HLSDownloader };

// Default export for the main orchestrator
export default HLSDownloader;
