import { ApiStackProps } from '../packages/infrastructure/src/stacks/ApiStack';

export interface TestEnvConfig {
  region: string;
  apiUrl: string;
  userPoolId: string;
  cognitoClientId: string;
  username: string;
  password: string;
}

/**
 * Extends stack props with deploy/start configuration
 */
export interface IMixedConfig extends ApiStackProps {
  dbpassword?: string;

  /**
   * Each pipeline creates a new bucket, which can push us past the bucket quota.
   * This allows us to re-use an existing one.
   */
  artifactBucketName?: string;

  /**
   * Source Repo Name in Github
   */

  repo: string;

  /**
   * Re-use an existing user pool
   */
  existingUserPoolId?: string;

  /**
   * Used for integration testing or running API locally
   */
  testing?: TestEnvConfig;
}

/**
 * Provides strongly typed configs for deployment
 * Configs should be matched to a branch. Use the GIT_BRANCH environment variable to override.
 */
interface IConfigs {
  [name: string]: IMixedConfig;
}

const mfDefaults: Omit<IMixedConfig, 'client' | 'stage'> = {
  project: 'data-api',
  loggingLevel: 'info',
  retain: false,
  env: {
    account: '190686435752',
    region: 'us-east-1',
  },
  repo: 'mergingfutures/cori-data-api',
  databaseConfig: {
    vpcId: 'vpc-0499b35a2f5231aae',
    databaseSecurityGroupId: 'sg-0be66ca1818bcc0e0',
    host: 'cori-database-small-dev.c0no2rvbbm4n.us-east-1.rds.amazonaws.com',
    dbname: 'data',
    parameterName: '/cori/read_only_user_credentials',
    dbuser: 'read_only_user',
  },
  cacheEnabled: true,
  cacheConfig: {
    host: 'redis-17358.c273.us-east-1-2.ec2.cloud.redislabs.com',
    port: 17358,
    username: 'default',
    parameterName: '/cori/redis-cluster-credentials',
  },
  /**
   * @todo: create a bucket with a prettier name
   */
  //artifactBucketName: 'coridataapicicdstack-devpipelineartifactsbucketfd-1smu59goaufdm',
  //coridataapicicdstack-devpipelineartifactsbucketfd-1smu59goaufdm
};

const coriDefaults: Omit<IMixedConfig, 'client' | 'stage'> = {
  project: 'data-api',
  loggingLevel: 'info',
  retain: true,
  repo: 'ruralinnovation/cori-data-api',
  env: {
    account: '312512371189',
    region: 'us-east-1',
  },
  databaseConfig: {
    vpcId: 'vpc-08f5e17f5b75ccee9',
    databaseSecurityGroupId: 'sg-01ddcc192d814136f',
    host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
    dbname: 'data',
    parameterName: '/postgresql/read_only_user_credentials',
    dbuser: 'read_only_user',
  },
  cacheEnabled: true,
  cacheConfig: {
    host: 'redis-19416.c283.us-east-1-4.ec2.cloud.redislabs.com:19416',
    port: 17358,
    username: 'default',
    parameterName: '/redis/default_user_credentials',
  },
  existingCognito: {
    userPoolId: 'us-east-1_QeA4600FA',
    userPoolDomain: 'authcori',
  },
};

export const Config: IConfigs = {
  'dev': {
    ...coriDefaults,
    client: 'cori',
    stage: 'dev',
    testing: {
      username: '',
      password: '',
      region: '',
      userPoolId: '',
      apiUrl: '',
      cognitoClientId: '',
    },
  },
  'cori/dev': {
    ...coriDefaults,
    client: 'cori',
    stage: 'dev',
    testing: {
      username: '',
      password: '',
      region: '',
      userPoolId: '',
      apiUrl: '',
      cognitoClientId: '',
    },
  },
  'local': {
    ...mfDefaults,
    client: 'mf',
    stage: 'local',
  },
};

export const getConfig = (name: string): IMixedConfig => {
  const config = Config[name];

  if (!config) {
    throw new Error(`Unknown config: ${name}`);
  }
  return config;
};
