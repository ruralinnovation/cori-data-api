/**
 * Type-safe integration with CDK
 */
export interface EnvConfigVars {
  LOGGING_LEVEL: string;
  PYTHON_API_URL: string;
  PYTHON_API_STAGE: string;
  [name: string]: string;
}

/**
 * Gets environment variable and throws meaningful message when null
 */
function getEnv(key: string, fallback: string = '') {
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
};
