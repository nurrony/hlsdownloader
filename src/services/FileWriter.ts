import { constants, createWriteStream } from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Utils } from './../utils.js';

/**
 * @class
 * @memberof module:HLSDownloader
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Manages file system operations including directory creation, path resolution, and stream persistence.
 */
class FileService {
  private destination: string;
  private overwrite: boolean;

  /**
   * @constructor
   * @param {string} destination - The root directory for downloads.
   * @param {boolean} overwrite - Whether to overwrite existing files.
   */
  constructor(destination: string, overwrite: boolean = false) {
    this.destination = destination;
    this.overwrite = overwrite;
  }

  /**
   * @method
   * @memberof class:FileService
   * @description Get the target directory path
   * @param {string} url - The URL to transform.
   * @returns {Promise<string>} The localized file path.
   */
  async getTargetPath(url: string): Promise<string> {
    const { pathname } = Utils.parseUrl(url);
    return path.join(this.destination, Utils.stripFirstSlash(pathname));
  }

  /**
   * @method
   * @memberof class:FileService
   * @description Ensures the destination directory exists for a specific URL.
   * @param {string} url - The URL of the file to be saved.
   * @returns {Promise<string>} The prepared absolute target path.
   */
  async prepareDirectory(url: string): Promise<string> {
    const targetPath = await this.getTargetPath(url);
    const destDirectory = path.dirname(targetPath);
    await fsPromises.mkdir(destDirectory, { recursive: true });
    return targetPath;
  }

  /**
   * @method
   * @memberof class:FileService
   * @description Verifies if writing is permitted based on the overwrite flag and existing files.
   *
   * @param {string} url - The URL to check against the file system.
   * @returns {Promise<boolean>} Returns true if writing should proceed.
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
   * @method
   * @memberof class:FileService
   * @description Pipes a web-standard ReadableStream to the local file system using stream/promises.
   *
   * @param {ReadableStream} webStream - The source stream from the network.
   * @param {string} filePath - The destination path.
   * @returns {Promise<void>} Resolves when the stream finishes writing.
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
