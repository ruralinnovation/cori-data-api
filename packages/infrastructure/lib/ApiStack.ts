import { Stack, StackProps, CfnOutput, Tags, Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Hosting } from '../constructs/Hosting';
import { Cognito } from '../constructs/cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApolloGraphqlServer } from '../src/lambdas/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { BcatServer } from '../constructs/BcatServer';
import { Networking } from '../constructs/Networking';
import { apolloConfig } from '../src/lambdas/ApolloGraphqlServer/ApolloGraphqlServer.handler';

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
}

interface AppSyncUserPoolConfig {
  userPoolId: string;
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

  // For overriding generated resources prefix;
  prefix?: string;

  loggingLevel: string;

  /**
   * Retain Dynamo Table and UserPool on delete
   */
  retain: boolean;

  /**
   * Define this prop to put lambdas in VPC. Expecting VPC to be in another stack.
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
   * Optional. When provided, will attach to existing user pool
   */
  existingUserPoolId?: string;

  /**
   * Optional. When provided, will re-use existing user pool domain
   */
  userPoolDomain?: string;
}

export class ApiStack extends Stack {
  prefix: string;

  apiKey: Secret;
  networking: Networking;

  cognito: Cognito;

  hosting: Hosting;

  /**
   * Used to connect values to integration test
   */
  pythonApiUrlOutput: CfnOutput;
  apolloApiUrlOutput: CfnOutput;
  userPoolIdOutput: CfnOutput;
  postmanClientIdOutput: CfnOutput;
  cognitoDomainOutput: CfnOutput;

  /**
   * Call build() to synth this construct when ready.
   */
  constructor(scope: Construct, id: string, private props: ApiStackProps) {
    super(scope, id, props);
    const { client, project, stage } = props;

    this.prefix = `${client}-data-api-${stage}`;

    this.buildResources();

    Tags.of(this).add('client', client);
    Tags.of(this).add('project', project);
    Tags.of(this).add('environment', stage);

    return this;
  }

  private buildResources() {
    const { prefix } = this;
    const { stage, existingUserPoolId, userPoolDomain, databaseConfig, cacheConfig, cacheEnabled, retain } = this.props;

    const dbPassword = ssm.StringParameter.valueFromLookup(this, databaseConfig.parameterName);
    const cachePassword = ssm.StringParameter.valueFromLookup(this, cacheConfig.parameterName);

    this.networking = new Networking(this, 'Networking', {
      prefix,
      databaseConfig,
    });

    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: existingUserPoolId,
      existingUserPoolDomain: userPoolDomain,
      prefix,
      userPoolDomainName: prefix,
      retain,
    });

    /**
     * Python API Handler
     */
    const bcat = new BcatServer(this, 'BcatServer', {
      prefix,
      stage,
      userPool: this.cognito.userPool,
      vpc: this.networking.vpc,
      securityGroups: [this.networking.lambdaSecurityGroup],
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: stage,
        SECRET: dbPassword,
        DB_USER: databaseConfig.dbuser,
        REGION: Aws.REGION,
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
    });

    /**
     * Apollo V3 GraphQL Api Handler
     */
    const apollo = new ApolloGraphqlServer(this, 'ApolloServer', {
      prefix,
      stage,
      userPool: this.cognito.userPool,
      logRetention: RetentionDays.FOUR_MONTHS,
      environment: {
        LOGGING_LEVEL: 'debug',
        PYTHON_API_URL: bcat.apiGw.apiEndpoint,
        PYTHON_API_STAGE: stage,
        // CF_URL: this.hosting.url,   // Circular dep
        CACHE_ENABLED: cacheEnabled ? 'true' : 'false',
        CACHE_HOST: cacheConfig.host,
        CACHE_PORT: '' + cacheConfig.port,
        CACHE_USERNAME: cacheConfig.username,
        CACHE_PASSWORD: cachePassword,
      },
    });

    // this.hosting = new Hosting(this, 'Hosting', {
    //   prefix,
    //   apiOriginConfigs: [
    //     {
    //       default: true,
    //       domain: bcat.apiGw.apiDomain,
    //       originPath: `/${stage}`,
    //       behaviorPathPattern: '/bcat/*',
    //     },
    //     {
    //       default: false,
    //       domain: apollo.apiGw.apiDomain,
    //       originPath: `/${stage}`,
    //       behaviorPathPattern: '/graphql*',
    //     },
    //   ],
    // });

    new CfnOutput(this, 'Region', { value: Aws.REGION });
    this.pythonApiUrlOutput = new CfnOutput(this, 'PythonApiUrl', { value: bcat.apiGw.apiEndpoint });
    this.apolloApiUrlOutput = new CfnOutput(this, 'ApolloApiUrl', { value: apollo.apiGw.apiEndpoint });
    this.userPoolIdOutput = new CfnOutput(this, 'UserPoolId', {
      value: this.cognito.userPool.userPoolId,
    });
    this.postmanClientIdOutput = new CfnOutput(this, 'PostmanClientId', {
      value: this.cognito.postmanClient.userPoolClientId,
    });
    this.cognitoDomainOutput = new CfnOutput(this, 'CognitoDomain', { value: this.cognito.userPoolDomain });
  }
}
