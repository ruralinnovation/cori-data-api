import { Construct } from 'constructs';
import { Token } from 'aws-cdk-lib';
import {
  IResource as ApiGatewayResource,
  RestApi,
  MockIntegration,
  PassthroughBehavior,
  ResponseType,
  CognitoUserPoolsAuthorizer,
  IRestApi,
  AwsIntegration,
  IntegrationOptions,
  MethodOptions,
} from 'aws-cdk-lib/aws-apigateway';
import { LambdasAndLogGroups } from './LambdasAndLogGroups';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { Function as BASE_FUNCTION } from 'aws-cdk-lib/aws-lambda';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { toPascal, toKebab } from './naming';
import { Mutable, HttpMethod } from '../interfaces';

interface GatewayResponse {
  type: ResponseType;
  statusCode: string;
}
export interface ApiProps {
  stage?: string;
  prefix: string;
  userPool?: IUserPool;
  allowedOrigins?: string[];
  gatewayResponses?: GatewayResponse[];
  /**
   * Automatically configure configure CloudWatch role
   */
  cloudWatchRole?: boolean;
}

export class MFApi extends Construct {
  public api: IRestApi;
  public stage: string;
  public authorizer?: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, private props: ApiProps) {
    super(scope, id);

    // CDK does not like unresolved tokens for stage
    this.stage = !props.stage || Token.isUnresolved(props.stage) ? 'prod' : props.stage;

    this.api = new RestApi(this, 'RestApi', {
      restApiName: toKebab(props.prefix),
      deployOptions: {
        stageName: this.stage,
      },
      cloudWatchRole: props.cloudWatchRole,
    });

    this.addGatewayResponses();

    if (props.userPool) {
      this.attachCognitoAuthorizer(props.userPool);
    }
  }

  public attachCognitoAuthorizer(userPool: IUserPool) {
    this.authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'Cognito',
    });
    this.authorizer._attachToApi(this.api);
  }

  public addLambda({
    method,
    path,
    lambda,
    options = {},
  }: {
    method: HttpMethod;
    path: string;
    lambda: BASE_FUNCTION;
    options?: Mutable<IntegrationOptions & MethodOptions>;
  }) {
    const resource = this.api.root.resourceForPath(path.startsWith('/') ? path : `/${path}`);
    const integration = new AwsIntegration({
      proxy: true,
      service: 'lambda',
      path: `2015-03-31/functions/${lambda.functionArn}/invocations`,
      options,
    });

    const _options = options;
    if (this.authorizer && method !== 'OPTIONS') {
      _options.authorizer = this.authorizer;
    }
    resource.addMethod(method, integration, _options);

    lambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com')); //Need to grant apigateway permission to invoke lambda when there are multiple stages

    try {
      this.addCorsMockIntegration(resource); // throws if added multiple times
    } catch {
      // Allow multiple resources of the same name with different methods
    }
  }

  /**
   * @deprecated
   */
  public addLambdasAndLogGroups({ apiResources }: LambdasAndLogGroups) {
    if (!apiResources?.size) {
      throw new Error('no resources to passed into Api construct');
    }
    for (const [{ method, path }, lambda] of apiResources) {
      this.addLambda({ method, path, lambda });
    }
  }

  private addGatewayResponses() {
    const defaultResponses: GatewayResponse[] = [
      { type: ResponseType.UNAUTHORIZED, statusCode: '401' },
      { type: ResponseType.ACCESS_DENIED, statusCode: '403' },
      { type: ResponseType.RESOURCE_NOT_FOUND, statusCode: '404' },
      { type: ResponseType.DEFAULT_5XX, statusCode: '500' },
    ] as GatewayResponse[];
    const responses = [...defaultResponses, ...(this.props.gatewayResponses || [])];
    // eslint-disable-next-line quotes
    const origin = this.props.allowedOrigins?.length ? this.props.allowedOrigins.join(' ') : "'*'";
    for (const { type, statusCode } of responses) {
      // If prefix contains a token, use base name.
      const responseId = Token.isUnresolved(this.props.prefix)
        ? toPascal(`GatewayResponse-${type.responseType}`)
        : toPascal(`${this.props.prefix}-GatewayResponse-${type.responseType}`);

      (this.api as RestApi).addGatewayResponse(responseId, {
        type,
        statusCode,
        responseHeaders: {
          'Access-Control-Allow-Origin': origin,
        },
      });
    }
  }

  private addCorsMockIntegration(apiResource: ApiGatewayResource) {
    apiResource.addMethod(
      'OPTIONS',
      new MockIntegration({
        integrationResponses: [
          {
            statusCode: '204',
            responseParameters: {
              /* eslint-disable quotes */
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'true'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
              /* eslint-enable quotes */
            },
          },
        ],
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '204',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );
  }
}
