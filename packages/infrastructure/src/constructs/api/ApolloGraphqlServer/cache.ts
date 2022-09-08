import { EnvConfig } from './EnvConfig';
import Redis, { RedisOptions } from 'ioredis';
import { BaseRedisCache, RedisClient } from 'apollo-server-cache-redis';

export interface CacheOptions {
  /**
   * @description Flag which indicate if the cache should be enabled. Default is true.
   */
  enabled?: boolean;

  /**
   * @description Redis connect options
   */
  redisOptions?: RedisOptions & {
    /**
     * @description The time to live in seconds. Default is 86400 (1 day)
     */
    ttl?: number;
  };
}
const globalTTL = parseInt(EnvConfig.CACHE_GLOBAL_TTL);

/**
 * @description The default options for the cache
 */
export const defaultCacheOptions: CacheOptions = {
  enabled: EnvConfig.CACHE_ENABLED === 'true',
  redisOptions: {
    ttl: 86400, // 24 hours
    host: EnvConfig.CACHE_HOST,
    port: parseInt(EnvConfig.CACHE_PORT),
    username: EnvConfig.CACHE_USERNAME,
    password: EnvConfig.CACHE_PASSWORD,
  },
};

export class Cache {
  cacheOptions: CacheOptions;
  rawCache: Redis;
  cache: BaseRedisCache;
  constructor(cacheOptions?: CacheOptions) {
    this.cacheOptions = cacheOptions || defaultCacheOptions;
    this.getRawCache();
  }
  getRawCache() {
    if (this.rawCache) {
      return this.rawCache;
    } else {
      this.rawCache = new Redis({
        host: this.cacheOptions.redisOptions?.host,
        port: this.cacheOptions.redisOptions?.port,
        username: this.cacheOptions.redisOptions?.username,
        password: this.cacheOptions.redisOptions?.password,
      });
      return this.rawCache;
    }
  }
  getCache() {
    if (this.cache) {
      return this.cache;
    } else {
      this.cache = new BaseRedisCache({
        client: this.getRawCache() as RedisClient,
      });
      return this.cache;
    }
  }
  /**
   * @description Get the cache key for a table and county
   *
   * @param {string} table The cache table name
   * @param {number | string} county The county
   * @returns The cache key
   */
  getCacheKey(table: string, county: string | number) {
    return `${table}-${county}`;
  }
  /**
   * @description Get the cache value
   *
   * @param {string} key The cache key
   * @returns The cache value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCacheValue(key: string): Promise<any> {
    if (this.cacheOptions.enabled && this.rawCache) {
      try {
        const res = await this.rawCache.get(key);
        if (res) {
          return JSON.parse(res);
        }
        return null;
      } catch (err) {
        console.log(err);
        throw err;
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  checkCache(key: string, cb: Function, maxAge: number = globalTTL): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        this.getCacheValue(key).then(cacheRes => {
          if (!cacheRes) {
            cb().then(dbValue => {
              if (!dbValue) {
                dbValue = null;
              }
              this.rawCache.setex(key, maxAge, JSON.stringify(dbValue));
              resolve(dbValue);
            });
          } else {
            resolve(cacheRes);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
