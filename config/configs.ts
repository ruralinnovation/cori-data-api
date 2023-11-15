import { ApiStackProps, DatabaseConfig, ServiceConfig } from '../packages/infrastructure/src/stacks';

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

  /**
   * Each pipeline creates a new bucket, which can push us past the bucket quota.
   * This allows us to re-use an existing one.
   */
  artifactBucketName?: string;

  /**
   * DataConfig
   */
  databaseConfig: DatabaseConfig;
  dbpassword?: string;

  /**
   * Source Repo Name in GitHub
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
 * Microervices Configuration
 * Automatically deploys custom endpoints and services.
 * [NOTE]: You must have a valid service in the directory noted.
 */
const microservicesConfiguration: ServiceConfig[] = [
  // {
  //   /* Test/Trial of Python REST service */
  //   logicalName: 'ACSService',
  //   corePath: '/acs',
  //   directoryName: 'acs',
  // },
  {
    /* Used by Broadband County Assessment Tool */
    logicalName: 'BCATService',
    corePath: '/bcat',
    directoryName: 'bcat',
  },
  {
    /* Used by Broadband Climate Risk Mitigation Tool */
    logicalName: 'ConnectHumanityService',
    corePath: '/ch',
    directoryName: 'ch',
  }
];
/**
 * Provides strongly typed configs for deployment
 * Configs should be matched to a branch. Use the GIT_BRANCH environment variable to override.
 */
interface IConfigs {
  [name: string]: IMixedConfig;
}

// const mfDefaults: Omit<IMixedConfig, 'client' | 'stage'> = {
//   project: 'data-api',
//   loggingLevel: 'info',
//   retain: false,
//   env: {
//     account: '190686435752',
//     region: 'us-east-1',
//   },
//   repo: 'mergingfutures/cori-data-api',
//   databaseConfig: {
//     vpcId: 'vpc-0499b35a2f5231aae',
//     databaseSecurityGroupId: 'sg-0be66ca1818bcc0e0',
//     host: 'cori-database-small-dev.c0no2rvbbm4n.us-east-1.rds.amazonaws.com',
//     dbname: 'data',
//     parameterName: '/cori/read_only_user_credentials',
//     dbuser: 'read_only_user',
//   },
//   cacheEnabled: true,
//   cacheConfig: {
//     host: 'redis-17358.c273.us-east-1-2.ec2.cloud.redislabs.com',
//     port: 17358,
//     username: 'default',
//     parameterName: '/cori/redis-cluster-credentials',
//     globalTTL: '86400',
//   },
//   microservicesConfig: microservicesConfiguration,
//   /**
//    * @todo: create a bucket with a prettier name
//    */
//   //artifactBucketName: 'coridataapicicdstack-devpipelineartifactsbucketfd-1smu59goaufdm',
//   //coridataapicicdstack-devpipelineartifactsbucketfd-1smu59goaufdm
//   testing: {
//     username: '/cori/int-test-user-name',
//     password: '/cori/int-test-user-pw',
//     region: 'us-east-1',
//     userPoolId: 'us-east-1_NE91zaapX',
//     apiUrl: 'https://d25ssrwsq4u9bu.cloudfront.net',
//     cognitoClientId: '6um99fv2qtb6f7ise3i037vna',
//   },
// };

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
    host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
    parameterName: '/postgresql/read_only_user_credentials',
    databaseSecurityGroupId: 'sg-01ddcc192d814136f',
    vpcId: 'vpc-08f5e17f5b75ccee9',
  },
  cacheEnabled: true,
  cacheConfig: {
    host: 'redis-19416.c283.us-east-1-4.ec2.cloud.redislabs.com',
    port: 19416,
    username: 'default',
    parameterName: '/redis/default_user_credentials',
    globalTTL: '86400',
  },
  existingCognito: {
    userPoolId: 'us-east-1_QeA4600FA',
    userPoolDomain: 'authcori',
  },
  microservicesConfig: microservicesConfiguration,
  testing: {
    username: '/cori/api/integration-test-username',
    password: '/cori/api/integration-test-password',
    region: 'us-east-1',
    userPoolId: 'us-east-1_QeA4600FA',
    apiUrl: 'https://d6q5pgqgx5oy5.cloudfront.net',
    cognitoClientId: '70o6i77h1orcnvonb9ua3fh58e',
  },
};

export const Config: IConfigs = {
  'cori/dev': {
    ...coriDefaults,
    // microservicesConfig: microservicesConfiguration, // <- add custom config
    client: 'cori',
    databaseConfig: {
      ...coriDefaults.databaseConfig,
      dbname: 'data',
      dbuser: 'read_only_user',
    },
    stage: 'dev'
  },
  'dev': {
    ...coriDefaults,
    client: 'cori',
    databaseConfig: {
      dbname: 'api-dev',
      dbuser: 'read_only_user',
      host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
      parameterName: '/postgresql/read_only_user_credentials',
      databaseSecurityGroupId: 'sg-01ddcc192d814136f',
      vpcId: 'vpc-08f5e17f5b75ccee9',
    },
    stage: 'dev'
  },
  'development': {
    ...coriDefaults,
    client: 'cori',
    databaseConfig: {
      dbname: 'api-dev',
      dbuser: 'read_only_user',
      host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
      parameterName: '/postgresql/read_only_user_credentials',
      databaseSecurityGroupId: 'sg-01ddcc192d814136f',
      vpcId: 'vpc-08f5e17f5b75ccee9',
    },
    stage: 'dev'
  },
  'local': {
    ...coriDefaults,
    client: 'cori',
    databaseConfig: {
      dbname: 'api-dev',
      dbuser: 'read_only_user',
      host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
      parameterName: '/postgresql/read_only_user_credentials',
      databaseSecurityGroupId: 'sg-01ddcc192d814136f',
      vpcId: 'vpc-08f5e17f5b75ccee9',
    },
    stage: 'local',
    testing: {
      region: coriDefaults.testing?.region || "",
      apiUrl: "http://localhost:2000",
      userPoolId: coriDefaults.testing?.userPoolId || "",
      cognitoClientId: coriDefaults.testing?.cognitoClientId || "",
      username: coriDefaults.testing?.username || "",
      password: coriDefaults.testing?.password || ""
    }
  },
  'pre': {
    // 'pre-deploy' (before dev/development)
    // ... used to test changes to the entire
    // pipeline in case 'dev' is disrupted
    ...coriDefaults,
    artifactBucketName: "cori-coridataapipipeline-pipelineartifactsbucket2-pre",
    client: 'cori',
    databaseConfig: {
      dbname: 'api-dev',
      dbuser: 'read_only_user',
      host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
      parameterName: '/postgresql/read_only_user_credentials',
      databaseSecurityGroupId: 'sg-01ddcc192d814136f',
      vpcId: 'vpc-08f5e17f5b75ccee9',
    },
    stage: 'pre'
  },
  'prod': {
    ...coriDefaults,
    client: 'cori',
    databaseConfig: {
      ...coriDefaults.databaseConfig,
      dbname: 'data',
      dbuser: 'read_only_user',
    },
    stage: 'prod'
  },
  'production': {
    ...coriDefaults,
    client: 'cori',
    databaseConfig: {
      dbname: 'api-prod',
      dbuser: 'read_only_user',
      host: 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com',
      parameterName: '/postgresql/read_only_user_credentials',
      databaseSecurityGroupId: 'sg-01ddcc192d814136f',
      vpcId: 'vpc-08f5e17f5b75ccee9',
    },
    stage: 'prod'
  }
};

export const getConfig = (name: string): IMixedConfig => {
  const config = Config[name];

  console.log("Get config:")
  console.log(name);
  console.log(config);

  if (!config) {
    throw new Error(`Unknown config: ${name}`);
  }
  return config;
};
