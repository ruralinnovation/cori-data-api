import * as pkgJson from '../package.json';

export const VERSION = pkgJson.version;
export const PROJECT_ROOT = __dirname;

/**
 * Type-safe way to access object keys
 * https://stackoverflow.com/a/67452316
 */
export const keysOf = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;
