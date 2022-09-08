import { join } from 'path';
import * as pkgJson from '../package.json';

export const version = pkgJson.version;
export const projectRoot = __dirname;

export const microservicesDirectory = join(projectRoot, '../../../python-microservices');

/**
 * Type-safe way to access object keys
 * https://stackoverflow.com/a/67452316
 */
export const keysOf = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;
