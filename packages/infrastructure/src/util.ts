import { join } from 'path';
import * as pkgJson from '../package.json';

export const version = pkgJson.version;
export const projectRoot = __dirname;

export const microservicesDirectory = join(projectRoot, '../../../python-microservices');

/**
 * Type-safe way to access object keys
 * https://stackoverflow.com/a/67452316
 */
// export const keysOf = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;
export const keysOf = <T>(obj: T) => {
  // Object.keys(obj) as Array<keyof T>;
  const keys: Array<keyof T> = [];
  // noinspection JSUnfilteredForInLoop
  for (const k in obj) try {
    if (typeof (<Object> obj).hasOwnProperty === 'function' && (<Object> obj).hasOwnProperty(k)) {
      keys.push(<keyof T> k);
    }
  } catch (err) {
    console.error("keysOf ERROR: ", err);
  }
  return (<Array<keyof T>>keys);
}
exports.keysOf = keysOf;