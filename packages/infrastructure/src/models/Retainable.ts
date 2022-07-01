export interface Retainable {
  /**
   * Retain data buckets, keys, tables, and logs on delete
   * Should only set the to `true` in production
   */
  retain?: boolean;
}
