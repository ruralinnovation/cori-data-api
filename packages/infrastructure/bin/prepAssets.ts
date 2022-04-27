import * as ncp from 'ncp';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fs from 'fs';

// This file copies the backend and frontend build artifacts to the dist/assets folder

export const copyFiles = (source: string, destination: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ncp.ncp(source, destination, (e: any) => {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });
};

export const cleanFolder = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  } else {
    rimraf.sync(path.join(dir, '*'));
  }
};

/**
 * Create layer assets for project
 * @param options Options for uploading to S3, otherwise local path is used.
 * @returns
 */
export const prepAssets = async (options?: {
  bucket: string;
  prefix: string;
  profile: string;
  outDir: string;
}): Promise<void> => {
  const assetsDir = path.resolve('./dist/assets');
  cleanFolder(assetsDir);

  await copyFiles(path.resolve('../backend/dist'), assetsDir);
};

prepAssets();
