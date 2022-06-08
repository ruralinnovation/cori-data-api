import { EnvConfig } from './EnvConfig';
const { BaseRedisCache } = require('apollo-server-cache-redis');
const Redis = require('ioredis');

const globalTTL = 1;

export class Cache {
  rawCache = null;
  cache = null;
  constructor() {}
  getRawCache() {
    if (this.rawCache) {
      return this.rawCache;
    } else {
      this.rawCache = new Redis({
        host: EnvConfig.CACHE_HOST,
        port: EnvConfig.CACHE_PORT,
        username: EnvConfig.CACHE_USERNAME,
        password: EnvConfig.CACHE_PASSWORD,
      });
      return this.rawCache;
    }
  }
  getCache() {
    if (this.cache) {
      return this.cache;
    } else {
      this.cache = new BaseRedisCache({
        client: this.getRawCache(),
      });
      return this.cache;
    }
  }
}

export const checkCache = async (
  redisClient: typeof Redis,
  key: string,
  callback: Function,
  maxAge: number = globalTTL
): Promise<Object | Array<any> | number> => {
  return new Promise(async (resolve, reject) => {
    redisClient.get(key, async (err, data) => {
      if (err) return reject(err);
      if (data != null) {
        console.log('Data ', data);
        console.log('read from cache');
        return resolve(JSON.parse(data));
      } else {
        console.log('read from db');
        let newData = await callback();
        if (!newData) newData = null;
        redisClient.setex(key, maxAge, JSON.stringify(newData));
        resolve(newData);
      }
    });
  });
};
