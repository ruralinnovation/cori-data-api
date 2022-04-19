import { Aws, Duration, Expiration, Stack, StackProps } from "aws-cdk-lib";
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
import { resolve } from "path";
import { Vpc, VpcLookupOptions } from "aws-cdk-lib/aws-ec2";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface ApiStackProps extends StackProps {
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
  vpc?: {
    vpc: ec2.IVpc;
    vpcSubnets: ec2.SubnetSelection;
    securityGroups: ec2.ISecurityGroup[];
  };

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

    const vpc = Vpc.fromLookup(this, "CoriDbVpc", {
      vpcId: "vpc-0499b35a2f5231aae",
    });

    const subnets = vpc.selectSubnets().subnets;

    this.props = props;
    this.prefix = `${props?.client}-data-api-${props?.stage}`;

    const api = new GraphqlApi(this, "AppSyncApi", {
      name: `cori-graphql-api-dev`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: true,
      schema: Schema.fromAsset("graphql/schema.graphql"),
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
      vpc: this.props.vpc !== undefined,
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
      },
    };

    new ApiLambda(this, "TestApi", {
      ...defaults,
      role: this.iam.roles.testApiRole,
      timeout: Duration.seconds(360),
      entry: resolve(__dirname, "../../../", "python-microservices/testApi"),
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
