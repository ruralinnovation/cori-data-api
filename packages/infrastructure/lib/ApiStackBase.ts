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
  api: Api;
  hosting: Hosting;
  stack: Stack;
  cognito: Cognito;
  iam: ApiIAM;
  graphqlApi: GraphqlApi;

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

    console.log('Successfully retrieved VPC info');

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

    this.api = new Api(this, 'Api', {
      prefix: this.prefix,
      stage: this.props.stage,
      cloudWatchRole: this.iam.roles === undefined,
    });

    this.hosting = new Hosting(this, 'Hosting', {
      prefix: this.prefix,
      api: this.api,
    });

    this.cognito = new Cognito(this, 'Cognito', {
      userPoolId: this.props.userPoolId,
      existingUserPoolDomain: this.props.userPoolDomain,
      prefix: this.prefix,
      userPoolName: `${this.prefix}`,
      userPoolDomainName: this.prefix,
      adminUserEmail: this.props.adminUserEmail,
      appUrl: this.hosting.url,
      callbackUrls: [this.hosting.url],
      logoutUrls: [`${this.hosting.url}/logout/`],
      retain: this.props.retain,
    });

    this.graphqlApi = new GraphqlApi(this, 'AppSyncApi', {
      name: `${this.prefix}-appsync-graphql`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: true,
      schema: Schema.fromAsset(resolve(__dirname, '../../', 'schemas/dist/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: Expiration.after(Duration.days(365)),
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.USER_POOL,
            userPoolConfig: {
              userPool: this.cognito.userPool,
              appIdClientRegex: '*',
              defaultAction: UserPoolDefaultAction.ALLOW,
            },
          },
        ],
      },
    });

    //this.api.attachCognitoAuthorizer(this.cognito.userPool);
    const pythonApiDev = this.graphqlApi.addHttpDataSource('pythonApiDatasource', this.api.api.url, {
      name: 'httpPythonRESTApi',
      description: 'AppSync to HTTP API',
    });

    /**
     * AWS Lambda Powertools Python Library Layer
     * https://awslabs.github.io/aws-lambda-powertools-python/latest/#lambda-layer
     */
    // const powerToolsLayer = LayerVersion.fromLayerVersionArn(
    //   this,
    //   'lambda-powertools',
    //   `arn:aws:lambda:${Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPython:17`
    // );

    const pythonDependencyLayer = new LayerVersion(this, 'DependencyLayer', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: Code.fromAsset(
        join(join(__dirname, '../../../', this.props.microservicesDirectory, '/dependency-layer/dependency-layer.zip'))
      ),
      compatibleRuntimes: [Runtime.PYTHON_3_8],
    });

    const defaults = {
      api: this.api,
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
      httpSource: pythonApiDev,
      apiOriginPath: this.props.stage,
    };

    new AppSyncApiLambda(this, 'TestApi', {
      ...defaults,
      entry: resolve(join(__dirname, '../../../', this.props.microservicesDirectory, '/deploy')),
    }).addPathsAndResolvers([
      {
        path: '/api/hello',
        methods: ['GET'],
        typeName: 'Query',
        fieldName: 'test',
      },
      {
        path: '/api/hello/{name}',
        methods: ['GET'],
        typeName: 'Query',
        fieldName: 'helloName',
      },
    ]);
    new AppSyncApiLambda(this, 'Auction904SubsidyAwards', {
      ...defaults,
      entry: resolve(
        join(__dirname, '../../../', this.props.microservicesDirectory, '/bcat/auction_904_subsidy_awards')
      ),
    }).addPathsAndResolvers([
      {
        path: '/api/bcat/auction_904_subsidy_awards',
        methods: ['GET'],
        typeName: 'Query',
        fieldName: 'get_bcat_auction_904_subsidy_awards',
      },
    ]);
  }

  private buildOutputs() {
    new CfnOutput(this, 'Region', { value: this.stack.region });
    new CfnOutput(this, 'RestApiUrl', { value: this.api.api.url });
    new CfnOutput(this, 'AppSyncGraphQLUrl', { value: this.graphqlApi.graphqlUrl });
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
