import { Stack, StackProps, CfnOutput, Tags, Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GraphqlApi } from '@aws-cdk/aws-appsync-alpha';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Hosting } from '../constructs/hosting';
import { Cognito } from '../constructs/cognito';
import { Vpc, SecurityGroup, IVpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApolloGraphqlServer } from '../src/lambdas/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Api } from '../constructs/Api';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { BcatServer } from '../constructs/BcatServer';

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
  props: ApiStackProps;
  prefix: string;
  pythonApi: Api;
  apolloApi: Api;
  hosting: Hosting;
  cognito: Cognito;
  graphqlApi: GraphqlApi;
  apiKey: Secret;
  vpc: IVpc;
  lambdaSecurityGroup: SecurityGroup;
  rdsSecurityGroup: ISecurityGroup;

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
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    this.props = props;

    this.prefix = `${props.client}-data-api-${props.stage}`;

    this.buildResources();

    this.buildOutputs();

    Tags.of(this).add('client', this.props.client);
    Tags.of(this).add('project', this.props.project);
    Tags.of(this).add('environment', this.props.stage);

    return this;
  }

  private buildNetworkingResources() {
    const { databaseConfig } = this.props;

    this.vpc = Vpc.fromLookup(this, 'CoriDbVpc', {
      vpcId: databaseConfig.vpcId,
    });

    this.lambdaSecurityGroup = new SecurityGroup(this, 'OutboundPythonLambdaSecurityGroup', {
      securityGroupName: `${this.prefix}-vpc-python-lambda-sg`,
      vpc: this.vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS access',
    });

    this.rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      'RDSSecurityGroup',
      databaseConfig.databaseSecurityGroupId
    );

    this.lambdaSecurityGroup.addEgressRule(this.rdsSecurityGroup, ec2.Port.tcp(5432), 'Allow Egress to PostgreSQL');
    this.rdsSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Ingress from Lambda');
  }

  private buildResources() {
    const { databaseConfig, cacheConfig, cacheEnabled } = this.props;

    const dbPassword = ssm.StringParameter.valueFromLookup(this, databaseConfig.parameterName);
    const cachePassword = ssm.StringParameter.valueFromLookup(this, cacheConfig.parameterName);

    const vpc = Vpc.fromLookup(this, 'CoriDbVpc', {
      vpcId: databaseConfig.vpcId,
    });

    const lambdaSecurityGroup = new SecurityGroup(this, 'OutboundPythonLambdaSecurityGroup', {
      securityGroupName: `${this.prefix}-vpc-python-lambda-sg`,
      vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS access',
    });

    const rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      'RDSSecurityGroup',
      databaseConfig.databaseSecurityGroupId
    );

    lambdaSecurityGroup.addEgressRule(rdsSecurityGroup, ec2.Port.tcp(5432), 'Allow Egress to PostgreSQL');
    rdsSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Ingress from Lambda');

    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: this.props.existingUserPoolId,
      existingUserPoolDomain: this.props.userPoolDomain,
      prefix: this.prefix,
      userPoolDomainName: this.prefix,
      retain: this.props.retain,
    });

    /**
     * Python API Handler
     */
    new BcatServer(this, 'BcatServer', {
      prefix: this.prefix,
      stage: this.props.stage,
      userPool: this.cognito.userPool,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: this.props.stage,
        SECRET: dbPassword,
        DB_USER: databaseConfig.dbuser,
        REGION: this.props.env.region || '',
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
    });

    /**
     * Apollo V3 GraphQL Api Handler
     */
    new ApolloGraphqlServer(this, 'ApolloServer', {
      prefix: this.prefix,
      stage: this.props.stage,
      userPool: this.cognito.userPool,
      logRetention: RetentionDays.FOUR_MONTHS,
      environment: {
        LOGGING_LEVEL: 'debug',
        PYTHON_API_URL: 'this.apiGw.api.url',
        PYTHON_API_STAGE: this.props.stage,
        // CF_URL: this.hosting.url,
        CACHE_ENABLED: cacheEnabled ? 'true' : 'false',
        CACHE_HOST: cacheConfig.host,
        CACHE_PORT: '' + cacheConfig.port,
        CACHE_USERNAME: cacheConfig.username,
        CACHE_PASSWORD: cachePassword,
      },
    });

  //   this.hosting = new Hosting(this, 'Hosting', {
  //     prefix: this.prefix + '-hosting',
  //     apiOriginConfigs: [
  //       {
  //         default: true,
  //         domain: this.pythonApi.apiDomain,
  //         originPath: `/${this.props.stage}`,
  //         behaviorPathPattern: '/data/*'
  //       },
  //       {
  //         default: false,
  //         domain: this.apolloApi.apiDomain,
  //         originPath: `/${this.props.stage}`,
  //         behaviorPathPattern: '/gql/*'
  //       }
  //     ]
  //   });
  // }

  private buildOutputs() {
    new CfnOutput(this, 'Region', { value: Aws.REGION });
    this.pythonApiUrlOutput = new CfnOutput(this, 'PythonApiUrl', { value: this.pythonApi.api.url });
    this.apolloApiUrlOutput = new CfnOutput(this, 'ApolloApiUrl', { value: this.pythonApi.api.url });
    this.userPoolIdOutput = new CfnOutput(this, 'UserPoolId', {
      value: this.cognito.userPool.userPoolId,
    });
    this.postmanClientIdOutput = new CfnOutput(this, 'PostmanClientId', {
      value: this.cognito.postmanClient.userPoolClientId,
    });
    this.cognitoDomainOutput = new CfnOutput(this, 'CognitoDomain', { value: this.cognito.userPoolDomain });
  }
}
