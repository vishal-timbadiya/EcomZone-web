import path from 'path';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import yauzl from 'yauzl';

/**
 * Streaming ZIP extraction.
 *
 * The previous implementation buffered the whole archive in memory (multer
 * memoryStorage), then adm-zip read the file into memory a second time, then
 * extractAllTo decompressed entries into further buffers. Peak usage was
 * roughly 3-4x the archive size, which OOM-killed the container on anything
 * approaching 100 MB.
 *
 * yauzl reads the central directory only, then hands out one read stream per
 * entry. Memory stays flat regardless of archive size - a 2 GB archive uses no
 * more RAM than a 2 MB one.
 */

export interface ExtractLimits {
  /** Reject archives declaring more than this many entries. */
  maxEntries: number;
  /** Reject once total uncompressed bytes exceed this (zip-bomb guard). */
  maxUncompressedBytes: number;
  /** Only these extensions are written to disk. */
  allowedExtensions: RegExp;
}

export interface ExtractedFile {
  /** Top-level directory inside the archive, used as the product code. */
  folder: string;
  /** Absolute path the entry was written to. */
  absolutePath: string;
  /** Original file name within the archive. */
  name: string;
}

export interface ExtractResult {
  files: ExtractedFile[];
  totalBytes: number;
  entriesSeen: number;
}

/** Reject absolute paths, drive letters, and any traversal outside the target. */
function isUnsafeEntryPath(entryName: string, targetDir: string): boolean {
  if (!entryName) return true;
  if (entryName.startsWith('/') || entryName.startsWith('\\')) return true;
  if (/^[a-zA-Z]:/.test(entryName)) return true;
  if (entryName.split(/[/\\]/).includes('..')) return true;

  const resolved = path.resolve(targetDir, entryName);
  return !resolved.startsWith(path.resolve(targetDir) + path.sep);
}

export function extractZipStreaming(
  zipPath: string,
  targetDir: string,
  limits: ExtractLimits
): Promise<ExtractResult> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (openErr, zipfile) => {
      if (openErr || !zipfile) {
        reject(new Error(`Could not read the ZIP file: ${openErr?.message || 'unknown error'}`));
        return;
      }

      if (zipfile.entryCount > limits.maxEntries) {
        zipfile.close();
        reject(new Error(`Archive contains ${zipfile.entryCount} files, limit is ${limits.maxEntries}`));
        return;
      }

      const files: ExtractedFile[] = [];
      let totalBytes = 0;
      let entriesSeen = 0;
      let failed = false;

      const fail = (message: string) => {
        if (failed) return;
        failed = true;
        zipfile.close();
        reject(new Error(message));
      };

      zipfile.on('error', (err) => fail(`ZIP read failed: ${err.message}`));

      zipfile.on('end', () => {
        if (!failed) resolve({ files, totalBytes, entriesSeen });
      });

      zipfile.on('entry', (entry) => {
        if (failed) return;
        entriesSeen++;

        const entryName: string = entry.fileName;

        // Directory entries carry no data.
        if (entryName.endsWith('/') || entryName.endsWith('\\')) {
          zipfile.readEntry();
          return;
        }

        if (isUnsafeEntryPath(entryName, targetDir)) {
          fail(`Unsafe path in archive: ${entryName}`);
          return;
        }

        // Skip macOS resource forks and hidden files rather than failing.
        const base = path.basename(entryName);
        if (entryName.startsWith('__MACOSX/') || base.startsWith('.')) {
          zipfile.readEntry();
          return;
        }

        if (!limits.allowedExtensions.test(base)) {
          zipfile.readEntry();
          return;
        }

        // uncompressedSize comes from the archive header, so it is checked
        // before decompressing rather than after.
        totalBytes += entry.uncompressedSize || 0;

        if (totalBytes > limits.maxUncompressedBytes) {
          fail('Archive expands beyond the allowed size');
          return;
        }

        // Only files nested inside a folder are products; the folder is the code.
        const segments = entryName.split(/[/\\]/).filter(Boolean);
        if (segments.length < 2) {
          zipfile.readEntry();
          return;
        }

        const folder = segments[0];
        const destDir = path.join(targetDir, folder);
        const destPath = path.join(destDir, base);

        zipfile.openReadStream(entry, async (streamErr, readStream) => {
          if (streamErr || !readStream) {
            fail(`Could not read "${entryName}": ${streamErr?.message || 'unknown error'}`);
            return;
          }

          try {
            await mkdir(destDir, { recursive: true });
            // Piped straight to disk - the entry is never held in memory.
            await pipeline(readStream, createWriteStream(destPath));

            files.push({ folder, absolutePath: destPath, name: base });
            zipfile.readEntry();
          } catch (writeErr: any) {
            fail(`Could not write "${entryName}": ${writeErr.message}`);
          }
        });
      });

      zipfile.readEntry();
    });
  });
}
