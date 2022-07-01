import { Stack, StackProps, CfnOutput, Tags, Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Hosting } from '../constructs/Hosting';
import { Cognito, ExistingCognitoConfig } from '../constructs/Cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApolloGraphqlServer } from '../constructs/api/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BcatServer } from '../constructs/api/BcatServer';
import { Networking } from '../constructs/Networking';

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
   * Optional. When provided, will attach to existing Cognito for authentication.
   */
  existingCognito?: ExistingCognitoConfig;
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

    const { client, project, stage, existingCognito, databaseConfig, cacheConfig, cacheEnabled, retain } = this.props;

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
     * Python API Handler
     */
    const bcat = new BcatServer(this, 'BcatServer', {
      prefix,
      stage,
      userPool: cognito.userPool,
      vpc: networking.vpc,
      securityGroups: [networking.lambdaSecurityGroup],
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
    const apollo = new ApolloGraphqlServer(this, 'ApolloServer', {
      prefix,
      stage,
      userPool: cognito.userPool,
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

    const hosting = new Hosting(this, 'Hosting', {
      prefix: `${prefix}-hosting`,
      apiOriginConfigs: [
        {
          default: true,
          domain: bcat.apiGw.apiDomain,
          originPath: `/${stage}`,
          behaviorPathPattern: '/bcat/*',
        },
        {
          default: false,
          domain: apollo.apiGw.apiDomain,
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
    this.pythonApiUrlOutput = new CfnOutput(this, 'PythonApiUrl', { value: bcat.apiGw.apiEndpoint });
    this.apolloApiUrlOutput = new CfnOutput(this, 'ApolloApiUrl', { value: apollo.apiGw.apiEndpoint });
    this.cloudFrontUrl = new CfnOutput(this, 'CloudFrontUrl', { value: hosting.url });
  }
}
