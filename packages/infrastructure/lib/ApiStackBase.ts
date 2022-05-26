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
import { LayerVersion, Code, Runtime, InlineCode } from 'aws-cdk-lib/aws-lambda';
import { AppSyncApiLambda } from '../constructs/lambda/AppSyncApiLambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Api } from '../constructs/api';
import { Hosting } from '../constructs/hosting';
import { Cognito } from '../constructs/cognito';
import { ApiIAM } from '../constructs/iam';
import { resolve, join } from 'path';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApiNodejsFunction, PythonLambda } from '../constructs/lambda';
import { ApolloGraphqlServer } from '../src/lambdas/ApolloGraphqlServer/ApolloGraphqlServer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { MFApi } from '../constructs/MFApi';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { ApiLambdaAuthorizer } from '../src/lambdas/ApiLambdaAuthorizer/ApiLambdaAuthorizer';
import { TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
export interface DatabaseConfig {
  vpcId: string;
  databaseSecurityGroupId: string;
  host: string;
  dbname: string;
  dbuser: string;
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
  pythonApi: MFApi;
  apolloApi: MFApi;
  pythonApiHosting: Hosting;
  graphqlApiHosting: Hosting;
  stack: Stack;
  cognito: Cognito;
  iam: ApiIAM;
  graphqlApi: GraphqlApi;
  apiKey: Secret;

  /**
   * Call build() to synth this construct when ready.
   */
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
  }

  private buildResources() {
    this.prefix = this.props.prefix ? this.props.prefix : `${this.props.client}-data-api-${this.props.stage}`;

    const { databaseConfig } = this.props;

    const dbPassword = ssm.StringParameter.valueFromLookup(this, databaseConfig.parameterName);

    console.log('Successfully retrieved db creds' + dbPassword);

    const vpc = Vpc.fromLookup(this, 'CoriDbVpc', {
      vpcId: databaseConfig.vpcId,
    });

    // this.apiKey = new Secret(this, 'ApiKeySecret', {
    //   secretName: this.prefix + '-api-key',
    // });

    // const lambdaAuthorizer = new ApiLambdaAuthorizer(this, 'ApiTokenAuthorizer', {
    //   prefix: this.prefix,
    //   logRetention: this.props.stage === 'prod' ? RetentionDays.SIX_MONTHS : RetentionDays.ONE_WEEK,
    //   environment: {
    //     LOGGING_LEVEL: this.props.stage === 'prod' ? 'INFO' : 'DEBUG',
    //     API_KEY: this.apiKey.secretValue.toString(),
    //   },
    // });

    const lambdaSecurityGroup = new SecurityGroup(this, 'OutboundLambdaSecurityGroup', {
      securityGroupName: `${this.prefix}-lambda-vpc-sg`,
      vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS access',
    });

    const rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      'RDSSecurityGroup',
      databaseConfig.databaseSecurityGroupId
    );

    lambdaSecurityGroup.addEgressRule(rdsSecurityGroup, ec2.Port.tcp(5432), 'Allow Egress to DB');

    // Could be redundant
    rdsSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Ingress from Lambda');

    // TODO
    // Check with using parameters store!!!

    this.iam = new ApiIAM(this, 'Roles', {
      prefix: this.prefix,
      vpc: this.props.databaseConfig.vpcId !== undefined,
    });

    // this.pythonApiHosting = new Hosting(this, 'Hosting', {
    //   prefix: this.prefix,
    //   api: this.api,
    // });

    // this.graphqlApiHosting = new Hosting(this, 'ApolloGraphqlHosting', {
    //   prefix: this.prefix + '-apollo-graphql',
    //   api: this.apolloApi,
    // });
    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: this.props.userPoolId,
      existingUserPoolDomain: this.props.userPoolDomain,
      prefix: this.prefix,
      userPoolName: `${this.prefix}`,
      userPoolDomainName: this.prefix,
      adminUserEmail: this.props.adminUserEmail,
      appClients: [
        // {
        //   userPoolClientName: this.prefix,
        //   callbackUrls: [this.pythonApiHosting.url],
        //   logoutUrls: [`${this.pythonApiHosting.url}/logout/`],
        // },
        // {
        //   userPoolClientName: this.prefix,
        //   callbackUrls: [this.graphqlApiHosting.url],
        //   logoutUrls: [`${this.graphqlApiHosting.url}/logout/`],
        // },
      ],
      retain: this.props.retain,
    });

    this.pythonApi = new MFApi(this, 'PythonApi', {
      prefix: this.prefix + '-python-gis-api',
      stage: this.props.stage,
      cloudWatchRole: this.iam.roles === undefined,
    });

    this.apolloApi = new MFApi(this, 'ApolloApi', {
      prefix: this.prefix + '-apollo-api',
      stage: this.props.stage,
      cloudWatchRole: this.iam.roles === undefined,
      // userPool: this.cognito.userPool,
      //apiKey: this.apiKey,
    });

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

    const pythonDependencyLayer = new LayerVersion(this, 'DependencyLayer', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: Code.fromAsset(
        join(join(__dirname, '../../../', this.props.microservicesDirectory, '/dependency-layer/dependency-layer.zip'))
      ),
      compatibleRuntimes: [Runtime.PYTHON_3_8],
    });

    const defaults = {
      api: this.pythonApi,
      runtime: Runtime.PYTHON_3_8,
      layers: [pythonDependencyLayer] as LayerVersion[],
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: this.props.stage,
        // CORS is only enabled in local development
        ALLOWED_ORIGINS_CSV: this.props.stage === 'local' ? 'http://localhost:3000' : '',
        SECRET: dbPassword,
        DB_USER: databaseConfig.dbuser,
        REGION: this.props.env.region || '',
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
      role: this.iam.roles.pythonLambdaRole,
      timeout: Duration.seconds(360),
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: true,
      // httpSource: pythonApiDev,
      apiOriginPath: this.props.stage,
    };

    const testApiFunction = new PythonLambda(this, 'TestApi', {
      ...defaults,
      functionName: this.prefix + '-test-api',
      entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, '/deploy')),
    });

    this.pythonApi.addLambda({
      method: 'GET',
      path: '/hello',
      lambda: testApiFunction.function,
    });

    this.pythonApi.addLambda({
      method: 'GET',
      path: '/hello/{name}',
      lambda: testApiFunction.function,
    });

    const subsidyFunction = new PythonLambda(this, 'Auction904SubsidyAwards', {
      ...defaults,
      functionName: this.prefix + '-auction-904-subsidy-awards-service',
      entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, 'bcat', 'c')),
    });

    this.pythonApi.addLambda({
      method: 'GET',
      path: '/bcat/auction_904_subsidy_awards',
      lambda: subsidyFunction.function,
    });

    const broadbandUnservedFunction = new PythonLambda(this, 'BroadbandUnservedBlocks', {
      ...defaults,
      functionName: this.prefix + '-broadband-unserved-blocks',
      entry: resolve(
        join(__dirname, '../../../', this.props.microservicesDirectory, 'bcat', 'broadband_unserved_blocks')
      ),
    });

    this.pythonApi.addLambda({
      method: 'GET',
      path: '/bcat/broadband_unserved_blocks',
      lambda: broadbandUnservedFunction.function,
    });

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
    //     path: '/api/bcat/auction_904_subsidy_awards',
    //     methods: ['GET'],
    //     typeName: 'Query',
    //     fieldName: 'get_bcat_auction_904_subsidy_awards',
    //   },
    // ]);
    const apolloServer = new ApolloGraphqlServer(this, 'ApolloApiServerLambda', {
      prefix: this.prefix,
      logRetention: RetentionDays.FOUR_MONTHS,
      environment: {
        PYTHON_API_URL: this.pythonApi.api.url,
        PYTHON_API_STAGE: this.props.stage,
      } as any,
    });

    this.apolloApi.addLambda({
      method: 'POST',
      path: '/graphql',
      lambda: apolloServer.function,
    });
    this.apolloApi.addLambda({
      method: 'GET',
      path: '/playground',
      lambda: apolloServer.function,
    });
    this.apolloApi.addLambda({
      method: 'POST',
      path: '/playground',
      lambda: apolloServer.function,
    });
  }

  private buildOutputs() {
    new CfnOutput(this, 'Region', { value: this.stack.region });
    new CfnOutput(this, 'PythonApiUrl', { value: this.pythonApi.api.url });
    // new CfnOutput(this, 'AppSyncGraphQLUrl', { value: this.graphqlApi.graphqlUrl });
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
