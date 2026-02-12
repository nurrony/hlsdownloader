import { constants, createWriteStream } from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Utils } from '../Utils.js';

/**
 * @category Services
 * @author Nur Rony<pro.nmrony@gmail.com>
 * Manages file system operations including directory creation, path resolution, and stream persistence.
 */
class FileService {
  private destination: string;
  private overwrite: boolean;

  /**
   * Constructor of FileService
   * @param destination - The root directory for downloads.
   * @param overwrite - Whether to overwrite existing files.
   */
  constructor(destination: string, overwrite: boolean = false) {
    this.destination = destination;
    this.overwrite = overwrite;
  }

  /**
   * Get the target directory path
   * @param url - The URL to transform.
   * @returns The localized file path.
   */
  async getTargetPath(url: string): Promise<string> {
    const { pathname } = Utils.parseUrl(url);
    return path.join(this.destination, Utils.stripFirstSlash(pathname));
  }

  /**
   * Ensures the destination directory exists for a specific URL.
   * @param url - The URL of the file to be saved.
   * @returns The prepared absolute target path.
   */
  async prepareDirectory(url: string): Promise<string> {
    const targetPath = await this.getTargetPath(url);
    const destDirectory = path.dirname(targetPath);
    await fsPromises.mkdir(destDirectory, { recursive: true });
    return targetPath;
  }

  /**
   * Verifies if writing is permitted based on the overwrite flag and existing files.
   * @param url - The URL to check against the file system.
   * @returns Returns true if writing should proceed.
   */
  async canWrite(url: string): Promise<boolean> {
    try {
      const targetPath = await this.getTargetPath(url);
      await fsPromises.access(targetPath, constants.F_OK);
      return this.overwrite;
    } catch (error: any) {
      if (error.code === 'ENOENT') return true;
      throw error;
    }
  }

  /**
   * Pipes a web-standard ReadableStream to the local file system using stream/promises.
   * @param webStream - The source stream from the network.
   * @param filePath - The destination path.
   * @returns Resolves when the stream finishes writing.
   */
  async saveStream(webStream: ReadableStream, filePath: string): Promise<void> {
    const readStream = Readable.fromWeb(webStream as any);
    const writeStream = createWriteStream(filePath);

    try {
      await pipeline(readStream, writeStream);
    } catch (err) {
      // Cleanup the file if the download/write fails
      await fsPromises.unlink(filePath).catch(() => {});
      throw err;
    }
  }
}

export default FileService;
