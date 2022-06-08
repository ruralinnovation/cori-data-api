import {
  Aws,
  Duration,
  Expiration,
  Stack,
  StackProps,
  CfnParameter,
  CfnOutput,
  Tags,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  GraphqlApi,
  Schema,
  FieldLogLevel,
  AuthorizationType,
  UserPoolDefaultAction,
} from '@aws-cdk/aws-appsync-alpha';
import { LayerVersion, Code, Runtime, InlineCode, Alias } from 'aws-cdk-lib/aws-lambda';
import { AppSyncApiLambda } from '../constructs/lambda/AppSyncApiLambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Hosting } from '../constructs/hosting';
import { Cognito } from '../constructs/cognito';
import { ApiIAM } from '../constructs/iam';
import { resolve, join } from 'path';
import { Vpc, SecurityGroup, IVpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApiNodejsFunction, PythonLambda } from '../constructs/lambda';
import { ApolloGraphqlServer } from '../src/lambdas/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Api } from '../constructs/Api';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { ApiLambdaAuthorizer } from '../src/lambdas/ApiLambdaAuthorizer/ApiLambdaAuthorizer';
import { TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { aws_elasticache as elasticache } from 'aws-cdk-lib';
import { RedisCluster } from '../constructs/RedisCluster';

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
export interface ApiStackBaseProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
  client: string;
  stage: string;
  project: string;
  microservicesDirectory: string;

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
   * Optional. When provided, will attach to existing user pool
   */

  userPoolId?: string;

  /**
   * Optional:  Additional configuration options for AppSync
   */
  appSyncConfig?: AppSyncConfig;

  /**
   * Optional. When provided, will re-use existing user pool domain
   */
  userPoolDomain?: string;
  adminUserEmail?: string;

  version?: string;
}

interface AppSyncConfig {
  /**
   * Optional: When provided will configure additional user pools in the app sync authorization configuration
   */
  additionalUserPools: AppSyncUserPoolConfig[];
}

interface AppSyncUserPoolConfig {
  userPoolId: string;
}

export class ApiBaseStack extends Stack {
  props: ApiStackBaseProps;
  prefix: string;
  pythonApi: Api;
  apolloApi: Api;
  hosting: Hosting;
  stack: Stack;
  cognito: Cognito;
  iam: ApiIAM;
  graphqlApi: GraphqlApi;
  apiKey: Secret;
  vpc: IVpc;
  lambdaSecurityGroup: SecurityGroup;
  rdsSecurityGroup: ISecurityGroup;

  /**
   * Call build() to synth this construct when ready.
   */
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
  }

  private buildNetworkingResources() {
    const { databaseConfig, cacheConfig, cacheEnabled } = this.props;

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

  private buildAuthenticationResources() {
    const { databaseConfig, userPoolDomain, adminUserEmail, userPoolId } = this.props;

    this.iam = new ApiIAM(this, 'Roles', {
      prefix: this.prefix,
      vpc: databaseConfig.vpcId !== undefined,
    });

    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: userPoolId,
      existingUserPoolDomain: userPoolDomain,
      prefix: this.prefix,
      userPoolName: `${this.prefix}`,
      userPoolDomainName: this.prefix,
      adminUserEmail: adminUserEmail,
      appClients: [],
      retain: this.props.retain,
    });
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

    this.iam = new ApiIAM(this, 'Roles', {
      prefix: this.prefix,
      vpc: this.props.databaseConfig.vpcId !== undefined,
    });

    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: this.props.userPoolId,
      existingUserPoolDomain: this.props.userPoolDomain,
      prefix: this.prefix,
      userPoolName: `${this.prefix}`,
      userPoolDomainName: this.prefix,
      adminUserEmail: this.props.adminUserEmail,
      appClients: [],
      retain: this.props.retain,
    });

    /**
     * Python Data RESTApi
     */
    this.pythonApi = new Api(this, 'PythonApi', {
      prefix: this.prefix + '-python-gis-api',
      stage: this.props.stage,
      // cloudWatchRole: this.iam.roles === undefined,
      cloudWatchRole: true,
      userPool: this.cognito.userPool,
      binaryMediaTypes: ['application~1x-protobuf', '*~1*'],
    });

    /**
     * Typescript Apollo Server GraphQL Api
     */
    this.apolloApi = new Api(this, 'ApolloApi', {
      prefix: this.prefix + '-apollo-api',
      stage: this.props.stage,
      // cloudWatchRole: this.iam.roles === undefined,
      cloudWatchRole: true,
      userPool: this.cognito.userPool,
    });

    /**
     * CloudFront Hosting
     * NEED WORK NOT WORKING
     */

    // this.hosting = new Hosting(this, 'Hosting', {
    //   prefix: this.prefix + '-hosting',
    //   apiOriginConfigs: [
    //     // {
    //     //   default: true,
    //     //   restApiId: this.pythonApi.api.restApiId,
    //     //   originPath: `/${this.props.stage}`,
    //     //   behaviorPathPattern: '/data/*',
    //     // },
    //     // {
    //     //   default: false,
    //     //   restApiId: this.apolloApi.api.restApiId,
    //     //   originPath: `/${this.props.stage}`,
    //     //   behaviorPathPattern: '/gql/*',
    //     // },
    //   ],
    // });

    /**
     * Python Dependency Lambda Layer
     * Speeds up Lambda initialization
     */

    const pythonDependencyLayer = new LayerVersion(this, 'DependencyLayer', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: Code.fromAsset(
        join(join(__dirname, '../../../', this.props.microservicesDirectory, '/dependency-layer/dependency-layer.zip'))
      ),
      compatibleRuntimes: [Runtime.PYTHON_3_8],
    });

    const defaults = {
      api: this.pythonApi,
      // cfUrl: this.hosting.url,
      timeout: Duration.seconds(360),
      vpc: vpc,
      allowPublicSubnet: true,
      apiOriginPath: this.props.stage,
    };

    const pythonDefaults = {
      ...defaults,
      securityGroups: [lambdaSecurityGroup],
      runtime: Runtime.PYTHON_3_8,
      layers: [pythonDependencyLayer] as LayerVersion[],
      memorySize: 256,
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: this.props.stage,
        SECRET: dbPassword,
        DB_USER: databaseConfig.dbuser,
        REGION: this.props.env.region || '',
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
    };

    const apolloDefaults = {
      prefix: this.prefix,
      logRetention: RetentionDays.FOUR_MONTHS,
      environment: {
        PYTHON_API_URL: this.pythonApi.api.url,
        PYTHON_API_STAGE: this.props.stage,
        // CF_URL: this.hosting.url,
        CACHE_ENABLED: cacheEnabled ? 'true' : 'false',
        CACHE_HOST: cacheConfig.host,
        CACHE_PORT: '' + cacheConfig.port,
        CACHE_USERNAME: cacheConfig.username,
        CACHE_PASSWORD: cachePassword,
      } as any,
    };

    if (this.props.stage === 'local') {
      /**
       * Local Lambda Instantiation for Local API
       */
      const localApiWrapper = new PythonLambda(this, 'LocalApi', {
        ...pythonDefaults,
        functionName: this.prefix + '-local-api',
        entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, 'local')),
      });

      this.pythonApi.addLambda({
        method: 'GET',
        path: '/local/{proxy+}',
        lambda: localApiWrapper.function,
      });
    } else {
      /**
       * BCAT Microservice
       */
      const bcatService = new PythonLambda(this, 'BCATService', {
        ...pythonDefaults,
        functionName: this.prefix + '-bcat-service',
        entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, 'bcat')),
      });

      const bcatVersion = bcatService.function.currentVersion;

      const bcatAlias = new Alias(this, 'LambdaAlias', {
        aliasName: this.props.stage,
        version: bcatVersion,
        provisionedConcurrentExecutions: 1,
      });

      bcatAlias.functionArn;

      this.pythonApi.addLambda({
        method: 'GET',
        path: '/bcat/{table}/geojson/{state_abbr}',
        lambda: bcatService.function,
      });
      this.pythonApi.addLambda({
        method: 'GET',
        path: '/bcat/{table}/tiles/{z}/{x}/{y}',
        lambda: bcatService.function,
      });
      this.pythonApi.addLambda({
        method: 'GET',
        path: '/bcat/{table}',
        lambda: bcatService.function,
      });
    }

    /**
     * Apollo V3 GraphQL Api Handler
     */
    const apolloServer = new ApolloGraphqlServer(this, 'ApolloApiServerLambda', {
      ...apolloDefaults,
    });

    this.apolloApi.addLambda({
      method: 'POST',
      path: '/graphql',
      lambda: apolloServer.function,
    });
    // this.apolloApi.addLambda({
    //   method: 'GET',
    //   path: '/playground',
    //   lambda: apolloServer.function,
    // });
    // this.apolloApi.addLambda({
    //   method: 'POST',
    //   path: '/playground',
    //   lambda: apolloServer.function,
    // });
  }

  private buildOutputs() {
    new CfnOutput(this, 'Region', { value: this.stack.region });
    // new CfnOutput(this, 'CFApiUrl', { value: this.hosting.url });
    new CfnOutput(this, 'PythonApiUrl', { value: this.pythonApi.api.url });
    new CfnOutput(this, 'ApolloApiUrl', { value: this.apolloApi.api.url });
    new CfnOutput(this, 'CognitoUserGroupId', { value: this.cognito.userPool.userPoolId });
  }
  /**
   * Building is not done in constructor so that product stack can add parameters.
   */
  protected build(props: ApiStackBaseProps): ApiBaseStack {
    this.props = props;
    this.stack = Stack.of(this);

    Tags.of(this).add('client', this.props.client);
    Tags.of(this).add('project', this.props.project);
    Tags.of(this).add('environment', this.props.stage);

    this.prefix = `${props.client}-data-api-${props.stage}`;

    this.buildResources();

    this.buildOutputs();

    return this;
  }
}

// new AppSyncApiLambda(this, 'TestApi', {
//   ...defaults,
//   entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, '/deploy')),
// }).addPathsAndResolvers([
//   {
//     path: '/api/hello',
//     methods: ['GET'],
//     typeName: 'Query',
//     fieldName: 'test',
//   },
//   {
//     path: '/api/hello/{name}',
//     methods: ['GET'],
//     typeName: 'Query',
//     fieldName: 'helloName',
//   },
// ]);
// new AppSyncApiLambda(this, 'Auction904SubsidyAwards', {
//   ...defaults,
//   entry: resolve(
//     join(__dirname, '../../../', this.props.microservicesDirectory, '/bcat/', 'auction_904_subsidy_awards')
//   ),
// }).addPathsAndResolvers([
//   {
//     path: '/bcat/auction_904_subsidy_awards',
//     methods: ['GET'],
//     typeName: 'Query',
//     fieldName: 'auction_904_subsidy_awards',
//   },
// ]);

//this.apolloApi.attachLambdaAuthorizer(lambdaAuthorizer.function);

// this.graphqlApi = new GraphqlApi(this, 'AppSyncApi', {
//   name: `${this.prefix}-appsync-graphql`,
//   logConfig: {
//     fieldLogLevel: FieldLogLevel.ALL,
//   },
//   xrayEnabled: true,
//   schema: Schema.fromAsset(resolve(__dirname, '../../', 'schemas/dist/schema.graphql')),
//   authorizationConfig: {
//     defaultAuthorization: {
//       authorizationType: AuthorizationType.API_KEY,
//       apiKeyConfig: {
//         expires: Expiration.after(Duration.days(365)),
//       },
//     },
//     additionalAuthorizationModes: [
//       {
//         authorizationType: AuthorizationType.USER_POOL,
//         userPoolConfig: {
//           userPool: this.cognito.userPool,
//           defaultAction: UserPoolDefaultAction.ALLOW,
//         },
//       },
//     ],
//   },
// });

//this.api.attachCognitoAuthorizer(this.cognito.userPool);
// const pythonApiDev = this.graphqlApi.addHttpDataSource('pythonApiDatasource', this.pythonApi.api.url, {
//   name: 'httpPythonRESTApi',
//   description: 'AppSync to HTTP API',
// });
