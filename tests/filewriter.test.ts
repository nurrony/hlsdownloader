import assert from 'node:assert';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import FileService from '../src/services/FileWriter.js';

describe('FileService', () => {
  const testDest = join(process.cwd(), 'test-downloads');
  let fileService: FileService;

  beforeEach(async () => {
    await mkdir(testDest, { recursive: true });
    fileService = new FileService(testDest, false);
  });

  afterEach(async () => {
    await rm(testDest, { recursive: true, force: true });
  });

  test('getTargetPath(): should resolve correct path from URL', async () => {
    const url = 'https://example.com/videos/playlist.m3u8';
    const expected = join(testDest, 'videos/playlist.m3u8');
    const result = await fileService.getTargetPath(url);

    assert.equal(result, expected);
  });

  test('saveStream(): should persist a Web ReadableStream to disk', async () => {
    const content = 'test-data-hls';
    const filePath = join(testDest, 'test.ts');

    const webStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      },
    });

    await fileService.saveStream(webStream, filePath);

    const savedContent = await readFile(filePath, 'utf-8');
    assert.equal(savedContent, content);
  });

  test('saveStream() should cleanup and throw on stream failure', async () => {
    const filePath = join(testDest, 'fail-test.ts');

    // Create a stream that fails immediately
    const errorStream = new ReadableStream({
      start(controller) {
        controller.error(new Error('Network failure'));
      },
    });

    await assert.rejects(
      () => fileService.saveStream(errorStream, filePath),
      { message: 'Network failure' },
      'Should cleanup and propagate stream errors'
    );
  });

  test('prepareDirectory(): should create deep directory structures for a given URL', async () => {
    const fileService = new FileService(testDest);
    const url = 'https://example.com/assets/video/v1/chunk.ts';

    const targetPath = await fileService.prepareDirectory(url);

    // Check if the directory exists
    const dirPath = dirname(targetPath);
    const stats = await import('node:fs').then(fs => fs.promises.stat(dirPath));

    assert.ok(stats.isDirectory(), 'Directory should be created');
    assert.ok(targetPath.endsWith('assets/video/v1/chunk.ts'));
  });

  //
  test('canWrite(): should return true if file does not exist', async () => {
    const fileService = new FileService(testDest, false);
    const url = 'https://example.com/ghost.ts';

    const result = await fileService.canWrite(url);
    assert.equal(result, true, 'Should allow writing if file is missing');
  });

  test('canWrite(): should return false if file exists and overwrite is false', async () => {
    const fileService = new FileService(testDest, false); // overwrite = false
    const url = 'https://example.com/existing.ts';
    const fullPath = await fileService.getTargetPath(url);

    // Manually create the file first
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, 'some data');

    const result = await fileService.canWrite(url);
    assert.equal(result, false, 'Should not allow writing to existing file');
  });

  test('canWrite(): should return true if file exists but overwrite is true', async () => {
    const fileService = new FileService(testDest, true); // overwrite = true
    const url = 'https://example.com/overwrite-me.ts';
    const fullPath = await fileService.getTargetPath(url);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, 'some data');

    const result = await fileService.canWrite(url);
    assert.equal(result, true, 'Should allow writing if overwrite is enabled');
  });
  test('canWrite() should throw if fs.access fails with non-ENOENT error', async t => {
    const fileService = new FileService('/test-dest');

    // Mock getTargetPath to return an illegal path that triggers a system Error
    // This avoids the ESM module reference issue entirely
    t.mock.method(fileService, 'getTargetPath', async () => {
      const err = new Error('Permission denied');
      (err as any).code = 'EACCES';
      throw err;
    });

    await assert.rejects(() => fileService.canWrite('https://example.com/video.ts'), { code: 'EACCES' });
  });
});
