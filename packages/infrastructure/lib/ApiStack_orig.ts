import {
  Aws,
  Duration,
  Expiration,
  Stack,
  StackProps,
  CfnParameter,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

import {
  GraphqlApi,
  Schema,
  FieldLogLevel,
  AuthorizationType,
  MappingTemplate,
} from "@aws-cdk/aws-appsync-alpha";
import { Code, Function, Runtime, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { ApiLambda } from "../constructs/lambda/ApiLambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Api } from "../constructs/api";
import { Hosting } from "../constructs/hosting";
import { Cognito } from "../constructs/cognito";
import { ApiIAM } from "../constructs/iam";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { resolve } from "path";
import {
  Vpc,
  VpcLookupOptions,
  SecurityGroup,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointService,
} from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface DatabaseConfig {
  vpcId: string;
  databaseSecurityGroupId: string;
  host: string;
  dbname: string;
  secretArn: string;
  secretName: string;
}
export interface ApiStackProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
  client: string;
  stage: string;

  loggingLevel: string;

  /**
   * Retain Dynamo Table and UserPool on delete
   */
  retain: boolean;

  /**
   * Optional. If if omitted, a new CMK will be created.
   */
  dynamoCmkId?: string;

  /**
   * Define this prop to put lambdas in VPC. Expecting VPC to be in another stack.
   */
  databaseConfig: DatabaseConfig;

  /**
   * Optional. When provided, will attach to existing user pool
   */
  userPoolId?: string;

  /**
   * Optional. When provided, will re-use existing user pool domain
   */
  userPoolDomain?: string;
  adminUserEmail?: string;

  version?: string;
}

export class ApiStack extends Stack {
  props: ApiStackProps;

  // Computed from parameters
  prefix: string;

  api: Api;
  hosting: Hosting;
  stack: Stack;
  cognito: Cognito;
  iam: ApiIAM;
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const dbPassword = new CfnParameter(this, "SECRET", {
      type: "String",
      description: "DB Password",
      default: "FILLMEIN",
    });

    /**
     * Create a new AppSync GraphQL API
     */

    /**
     *   vpc?: {
    vpc: ec2.IVpc;
    vpcSubnets: ec2.SubnetSelection;
    securityGroups: ec2.ISecurityGroup[];
  };
     */
    this.props = props;
    const { databaseConfig } = props;
    this.prefix = `${props?.client}-data-api-${props?.stage}`;

    const vpc = Vpc.fromLookup(this, "CoriDbVpc", {
      vpcId: props.databaseConfig.vpcId,
    });

    //const subnets = vpc.selectSubnets();

    const lambdaSecurityGroup = new SecurityGroup(
      this,
      "OutboundLambdaSecurityGroup",
      {
        securityGroupName: `${this.prefix}-lambda-sg`,
        vpc,
        allowAllOutbound: false,
        description: "Security group for RDS access",
      }
    );

    // lambdaSecurityGroup.connections.allowTo(
    //   database,
    //   ec2.Port.tcp(5432),
    //   "RDS Instance"
    // );

    // const vpcSecurityGroup = new SecurityGroup(
    //   this,
    //   "InboundLambdaSecurityGroup",
    //   {
    //     securityGroupName: `${this.prefix}-vpc-sg`,
    //     vpc,
    //     description: "Security group for RDS VPC access",
    //   }
    // );

    const rdsSecurityGroup = SecurityGroup.fromLookupById(
      this,
      "RDSSecurityGroup",
      databaseConfig.databaseSecurityGroupId
    );

    // const vpcEndpointSg = new SecurityGroup(this, "VPCENPSG", {
    //   securityGroupName: `${this.prefix}-vpcep-sg`,
    //   vpc,
    //   description: "Security group for VPC Endpoint access",
    // });

    // const vpcEndpoint = new InterfaceVpcEndpoint(this, "SecretsVPCEndpoint", {
    //   vpc,
    //   service: new InterfaceVpcEndpointService(
    //     `com.amazonaws.${props.env.region}.secretsmanager`
    //   ),
    //   securityGroups: [vpcEndpointSg],
    // });

    // const vpcEPStatement = new PolicyStatement({
    //   actions: ["secretsmanager:*"],
    //   resources: [databaseConfig.secretArn],
    // });
    // vpcEPStatement.addAnyPrincipal();

    // vpcEndpoint.addToPolicy(vpcEPStatement);

    lambdaSecurityGroup.addEgressRule(
      rdsSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow Egress to DB"
    );

    // lambdaSecurityGroup.addIngressRule(vpcEndpointSg, ec2.Port.allTcp());
    // lambdaSecurityGroup.addEgressRule(vpcEndpointSg, ec2.Port.allTcp());

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow Ingress from Lambda"
    );
    // database.connections.addSecurityGroup(vpcSecurityGroup);

    const api = new GraphqlApi(this, "AppSyncApi", {
      name: `cori-graphql-api-dev`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: true,
      schema: Schema.fromAsset(
        resolve(__dirname, "../../", "schemas/dist/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: Expiration.after(Duration.days(365)),
          },
        },
      },
    });

    this.iam = new ApiIAM(this, "Roles", {
      prefix: this.prefix,
      vpc: this.props.databaseConfig.vpcId !== undefined,
      secretArn: databaseConfig.secretArn,
    });

    this.api = new Api(this, "Api", {
      prefix: this.prefix,
      stage: this.props.stage,
      cloudWatchRole: this.iam.roles === undefined,
    });

    this.hosting = new Hosting(this, "Hosting", {
      prefix: this.prefix,
      api: this.api,
    });

    this.cognito = new Cognito(this, "Cognito", {
      userPoolId: this.props.userPoolId,
      existingUserPoolDomain: this.props.userPoolDomain,
      prefix: this.prefix,
      userPoolName: this.prefix,
      userPoolDomainName: this.prefix,
      adminUserEmail: this.props.adminUserEmail,
      appUrl: this.hosting.url,
      callbackUrls: [this.hosting.url],
      logoutUrls: [`${this.hosting.url}/logout/`],
      retain: this.props.retain,
    });

    //this.api.attachCognitoAuthorizer(this.cognito.userPool);

    /**
     * AWS Lambda Powertools Python Library Layer
     * https://awslabs.github.io/aws-lambda-powertools-python/latest/#lambda-layer
     */
    const powerToolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      "lambda-powertools",
      `arn:aws:lambda:${Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPython:17`
    );

    const defaults = {
      api: this.api,
      runtime: Runtime.PYTHON_3_8,
      layers: [powerToolsLayer] as LayerVersion[],
      environment: {
        LOGGING_LEVEL: this.props.loggingLevel,
        STAGE: this.props.stage,
        // CORS is only enabled in local development
        ALLOWED_ORIGINS_CSV:
          this.props.stage === "local" ? "http://localhost:3000" : "",
        SECRET: dbPassword.valueAsString,
        DB_USER: databaseConfig.secretName,
        REGION: props.env?.region || "",
        DB_HOST: databaseConfig.host,
        DB_NAME: databaseConfig.dbname,
      },
    };

    new ApiLambda(this, "TestApi", {
      ...defaults,
      role: this.iam.roles.pythonLambdaRole,
      timeout: Duration.seconds(360),
      entry: resolve(__dirname, "../../../", "python-microservices/testApi"),
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: true,
    }).addPaths({
      "/api/hello": ["GET"],
      "/api/hello/{name}": ["GET"],
    });

    const pythonApiDev = api.addHttpDataSource(
      "pythonApiDatasource",
      this.api.api.url,
      {
        name: "httpPythonRESTApi",
        description: "AppSync to HTTP API",
      }
    );

    pythonApiDev.createResolver({
      typeName: "Query",
      fieldName: "test",
      requestMappingTemplate: MappingTemplate.fromString(
        JSON.stringify({
          version: "2018-05-29",
          method: "GET",
          resourcePath: `/prod/api/hello`,
          params: {
            headers: {
              "Content-Type": "application/json",
            },
          },
        })
      ),
      responseMappingTemplate: MappingTemplate.fromString("$ctx.result.body"),
    });
    pythonApiDev.createResolver({
      typeName: "Query",
      fieldName: "helloName",
      requestMappingTemplate: MappingTemplate.fromString(
        JSON.stringify({
          version: "2018-05-29",
          method: "GET",
          resourcePath: `/prod/api/hello/$context.arguments.name`,
          params: {
            headers: {
              "Content-Type": "application/json",
            },
          },
        })
      ),
      responseMappingTemplate: MappingTemplate.fromString("$ctx.result.body"),
    });
  }
}
