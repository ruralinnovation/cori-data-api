import { Stack, StackProps, CfnOutput, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Hosting } from '../src/constructs/Hosting';
import { Cognito, ExistingCognitoConfig } from '../src/constructs/Cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApolloGraphqlServer } from '../src/constructs/api/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Networking } from '../src/constructs/Networking';
import { PythonDataServer } from '../src/constructs/api/PythonDataServer';

export interface DatabaseConfig {
  vpcId: string;
  databaseSecurityGroupId: string;
  host: string;
  dbname: string;
  dbuser: string;
  parameterName: string;
}
export interface CacheConfig {
  host: string;
  port: number;
  username: string;
  parameterName: string;
  globalTTL: string;
}

interface AppSyncUserPoolConfig {
  userPoolId: string;
}

export interface ServiceConfig {
  /**
   * The Logical Name of the service (NO SPACES) e.g. BCATService
   */
  logicalName: string;
  /**
   * The Core path to trigger the Microservice e.g. /bcat
   */
  corePath: string;
  /**
   * The name of the directory this service is located.  e.g. bcat
   */
  directoryName: string;
}

interface AppSyncConfig {
  /**
   * Optional: When provided will configure additional user pools in the app sync authorization configuration
   */
  additionalUserPools: AppSyncUserPoolConfig[];
}

export interface ApiStackProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
  client: string;
  stage: string;
  project: string;

  loggingLevel: string;

  /**
   * Retain Dynamo Table and UserPool on delete
   */
  retain: boolean;

  /**
   * Database integration configuration
   * Puts lambdas in VPC. Expecting VPC to be in another stack or deployed already.
   * DB creds are accessed through parameter store and deployed as part of the lambda service environment.
   *
   */
  databaseConfig: DatabaseConfig;

  /**
   *
   */
  cacheEnabled: boolean;
  cacheConfig: CacheConfig;

  /**
   * Optional:  Additional configuration options for AppSync
   */
  appSyncConfig?: AppSyncConfig;

  /**
   * Optional. When provided, will attach to existing Cognito for authentication.
   */
  existingCognito?: ExistingCognitoConfig;

  microservicesConfig: ServiceConfig[];
}
export class ApiStack extends Stack {
  /**
   * Used to connect values to integration test
   */
  pythonApiUrlOutput: CfnOutput;
  apolloApiUrlOutput: CfnOutput;
  userPoolIdOutput: CfnOutput;
  postmanClientIdOutput: CfnOutput;
  cognitoDomainOutput: CfnOutput;
  cloudFrontUrl: CfnOutput;

  /**
   * Call build() to synth this construct when ready.
   */
  constructor(scope: Construct, id: string, private props: ApiStackProps) {
    super(scope, id, props);

    const {
      client,
      project,
      stage,
      existingCognito,
      databaseConfig,
      cacheConfig,
      cacheEnabled,
      retain,
      microservicesConfig,
    } = this.props;

    const prefix = `${client}-data-api-${stage}`;

    const dbPassword = ssm.StringParameter.valueFromLookup(this, databaseConfig.parameterName);
    const cachePassword = ssm.StringParameter.valueFromLookup(this, cacheConfig.parameterName);

    const networking = new Networking(this, 'Networking', {
      prefix,
      databaseConfig,
    });

    const cognito = new Cognito(this, 'Cognito', {
      prefix,
      userPoolDomainName: prefix,
      existingCognito,
      retain,
    });

    /**
     * Python Data RESTApi
     */

    const pythonServer = new PythonDataServer(this, 'PythonDataServer', {
      prefix,
      stage,
      userPool: cognito.userPool,
      vpc: networking.vpc,
      securityGroups: [networking.lambdaSecurityGroup],
      microservicesConfig,
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: stage,
        SECRET: dbPassword,
        DB_USER: databaseConfig.dbuser,
        REGION: props.env.region,
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
    });

    /**
     * Apollo V3 GraphQL Api Handler
     */
    const apolloServer = new ApolloGraphqlServer(this, 'ApolloServer', {
      prefix,
      stage,
      userPool: cognito.userPool,
      logRetention: RetentionDays.FOUR_MONTHS,
      environment: {
        LOGGING_LEVEL: 'debug',
        PYTHON_API_URL: pythonServer.apiGw.apiEndpoint,
        PYTHON_API_STAGE: stage,
        // CF_URL: this.hosting.url,   // Circular dep
        CACHE_ENABLED: cacheEnabled ? 'true' : 'false',
        CACHE_HOST: cacheConfig.host,
        CACHE_PORT: '' + cacheConfig.port,
        CACHE_USERNAME: cacheConfig.username,
        CACHE_PASSWORD: cachePassword,
        CACHE_GLOBAL_TTL: cacheConfig.globalTTL || '86400',
      },
    });

    const hosting = new Hosting(this, 'Hosting', {
      prefix: `${prefix}-hosting`,
      apiOriginConfigs: [
        {
          default: true,
          domain: pythonServer.apiGw.apiDomain,
          originPath: `/${stage}`,
          behaviorPathPattern: '/bcat/*',
        },
        {
          default: false,
          domain: apolloServer.apiGw.apiDomain,
          originPath: `/${stage}`,
          behaviorPathPattern: '/graphql*',
        },
      ],
      retain,
    });

    // Apply Tags
    Tags.of(this).add('client', client);
    Tags.of(this).add('project', project);
    Tags.of(this).add('environment', stage);

    // Define stack outputs
    this.cognitoDomainOutput = new CfnOutput(this, 'CognitoDomain', { value: cognito.userPoolDomain });
    this.userPoolIdOutput = new CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
    });
    this.postmanClientIdOutput = new CfnOutput(this, 'PostmanClientId', {
      value: cognito.postmanClient.userPoolClientId,
    });
    this.pythonApiUrlOutput = new CfnOutput(this, 'PythonApiUrl', { value: pythonServer.apiGw.apiEndpoint });
    this.apolloApiUrlOutput = new CfnOutput(this, 'ApolloApiUrl', { value: apolloServer.apiGw.apiEndpoint });
    this.cloudFrontUrl = new CfnOutput(this, 'CloudFrontUrl', { value: hosting.url });
  }
}
