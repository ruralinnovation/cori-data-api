export const httpMethods = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = typeof httpMethods[number];
export function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === 'string' && httpMethods.includes(value.toUpperCase() as HttpMethod);
}

export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export interface Retainable {
  /**
   * Retain data buckets, keys, tables, and logs on delete
   * Should only set the to `true` in production
   */
  retain?: boolean;
}
