/**
 * Type-safe integration with CDK
 */
export interface EnvConfigVars {
  LOGGING_LEVEL: string;
  PYTHON_API_URL: string;
  PYTHON_API_STAGE: string;
  CACHE_ENABLED: string;
  CACHE_HOST: string;
  CACHE_PORT: string;
  CACHE_USERNAME: string;
  CACHE_PASSWORD: string;
  CACHE_GLOBAL_TTL: string;
  APOLLO_KEY: string;
  APOLLO_GRAPH_REF: string;
  APOLLO_SCHEMA_REPORTING: string;
  [name: string]: string;
}

/**
 * Gets environment variable and throws meaningful message when null
 */
function getEnv(key: string, fallback = '') {
  const val: string = (process.env[key] as string) || fallback;
  if (!val) {
    throw new Error(`Expected environment variable ${key} to not be null`);
  }
  return val;
}

export const EnvConfig: EnvConfigVars = {
  LOGGING_LEVEL: getEnv('LOGGING_LEVEL', 'DEBUG'),
  PYTHON_API_URL: getEnv('PYTHON_API_URL'),
  PYTHON_API_STAGE: getEnv('PYTHON_API_STAGE'),
  CACHE_ENABLED: getEnv('CACHE_ENABLED'),
  CACHE_HOST: getEnv('CACHE_HOST'),
  CACHE_PORT: getEnv('CACHE_PORT'),
  CACHE_USERNAME: getEnv('CACHE_USERNAME'),
  CACHE_PASSWORD: getEnv('CACHE_PASSWORD'),
  CACHE_GLOBAL_TTL: getEnv('CACHE_GLOBAL_TTL', '86400'),
  get APOLLO_STUDIO_ENABLED() {
    if (this.APOLLO_KEY !== 'NOT_SET' && this.APOLLO_GRAPH_REF !== 'NOT_SET') {
      return 'TRUE';
    } else {
      return 'FALSE';
    }
  },
  APOLLO_KEY: getEnv('APOLLO_KEY', 'NOT_SET'),
  APOLLO_GRAPH_REF: getEnv('APOLLO_GRAPH_REF', 'NOT_SET'),
  APOLLO_SCHEMA_REPORTING: getEnv('APOLLO_SCHEMA_REPORTING', 'true'),
};
