import { ApiStackProps } from '../lib/ApiStack';

export interface IMixedConfig extends ApiStackProps {
  /** This is used by start-api only
   *  You can add this prop to your config after initial deploy
   */
  startApiUserPoolId?: string;
  dbpassword?: string;
}

/**
 * Provides strongly typed configs for deployment
 */
interface IConfigs {
  [name: string]: IMixedConfig;
}

export const getConfig = (name: string): IMixedConfig => {
  const config = Config[name];

  if (!config) {
    throw new Error(`Unknown config: ${name}`);
  }
  return config;
};

export const Config: IConfigs = {
  'mf-dev': {
    client: 'mf',
    stage: 'dev',
    project: 'data-api',
    loggingLevel: 'info',
    retain: false,
    microservicesDirectory: 'python-microservices',
    env: {
      account: '190686435752',
      region: 'us-east-1',
    },
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
  },
  'local': {
    client: 'mf',
    stage: 'local',
    project: 'data-api',
    loggingLevel: 'info',
    retain: false,
    microservicesDirectory: 'python-microservices',
    env: {
      account: '190686435752',
      region: 'us-east-1',
    },
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
  },
  'dev1': {
    client: 'cori',
    stage: 'dev',
    project: 'data-api',
    loggingLevel: 'info',
    retain: false,
    microservicesDirectory: 'python-microservices',
    env: {
      account: '190686435752',
      region: 'us-east-1',
    },
    databaseConfig: {
      vpcId: 'vpc-0499b35a2f5231aae',
      databaseSecurityGroupId: 'sg-0cdb6d6c66b8e6a4a',
      host: 'cori-testing-db.c0no2rvbbm4n.us-east-1.rds.amazonaws.com',
      dbname: 'postgres',
      parameterName: 'cori-data-api-read_only_user_password',
      dbuser: 'read_only_user',
    },
    cacheEnabled: true,
    cacheConfig: {
      host: 'redis-17358.c273.us-east-1-2.ec2.cloud.redislabs.com',
      port: 17358,
      username: 'default',
      parameterName: '/cori/redis-cluster-credentials',
    },
  },
  'dev': {
    client: 'cori',
    stage: 'dev',
    project: 'data-api',
    loggingLevel: 'info',
    retain: false,
    microservicesDirectory: 'python-microservices',
    env: {
      account: '190686435752',
      region: 'us-east-1',
    },
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
  },
  'prod': {
    client: 'cori',
    stage: 'prod',
    project: 'data-api',
    loggingLevel: 'info',
    retain: true,
    microservicesDirectory: 'python-microservices',
    env: {
      account: '190686435752',
      region: 'us-east-1',
    },
    databaseConfig: {
      vpcId: 'vpc-0499b35a2f5231aae',
      databaseSecurityGroupId: 'sg-0cdb6d6c66b8e6a4a',
      host: 'cori-testing-db.c0no2rvbbm4n.us-east-1.rds.amazonaws.com',
      dbname: 'postgres',
      parameterName: 'cori-data-api-read_only_user_password',
      dbuser: 'read_only_user',
    },
    cacheEnabled: true,
    cacheConfig: {
      host: 'redis-17358.c273.us-east-1-2.ec2.cloud.redislabs.com',
      port: 17358,
      username: 'default',
      parameterName: '/cori/redis-cluster-credentials',
    },
  },
};
