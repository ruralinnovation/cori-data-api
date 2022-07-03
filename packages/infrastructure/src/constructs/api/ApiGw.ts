import { Construct } from 'constructs';
import {
  IResource as ApiGatewayResource,
  RestApi,
  MockIntegration,
  PassthroughBehavior,
  ResponseType,
  CognitoUserPoolsAuthorizer,
  AwsIntegration,
  IntegrationOptions,
  MethodOptions,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { Function as BASE_FUNCTION } from 'aws-cdk-lib/aws-lambda';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { toPascal, toKebab } from '../../naming';
import { Mutable, HttpMethod } from '../../models/interfaces';
import { Aws } from 'aws-cdk-lib';

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
  binaryMediaTypes?: string[];
}

export class ApiGw extends Construct {
  readonly api: RestApi;
  authorizer?: CognitoUserPoolsAuthorizer;
  tokenAuthorizer?: TokenAuthorizer;
  readonly apiDomain: string;
  readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, private props: ApiProps) {
    super(scope, id);

    this.api = new RestApi(this, 'RestApi', {
      restApiName: toKebab(props.prefix),
      deployOptions: {
        stageName: props.stage,
      },
      cloudWatchRole: props.cloudWatchRole,
      binaryMediaTypes: props.binaryMediaTypes || undefined,
    });

    this.addGatewayResponses();

    if (props.userPool) {
      this.attachCognitoAuthorizer(props.userPool);
    }

    this.apiDomain = `${this.api.restApiId}.execute-api.${Aws.REGION}.amazonaws.com`;
    this.apiEndpoint = `https://${this.apiDomain}/${props.stage}/`;
  }

  public attachCognitoAuthorizer(userPool: IUserPool) {
    this.authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'Cognito',
    });
    this.authorizer._attachToApi(this.api);
  }

  public attachLambdaAuthorizer(handler: BASE_FUNCTION) {
    this.tokenAuthorizer = new TokenAuthorizer(this, 'TokenAuthorizer', {
      handler,
    });
    this.tokenAuthorizer._attachToApi(this.api);
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

  private addGatewayResponses() {
    const defaultResponses: GatewayResponse[] = [
      { type: ResponseType.UNAUTHORIZED, statusCode: '401' },
      { type: ResponseType.ACCESS_DENIED, statusCode: '403' },
      { type: ResponseType.RESOURCE_NOT_FOUND, statusCode: '404' },
      { type: ResponseType.DEFAULT_5XX, statusCode: '500' },
    ] as GatewayResponse[];
    const responses = [...defaultResponses, ...(this.props.gatewayResponses || [])];
    const origin = this.props.allowedOrigins?.length ? this.props.allowedOrigins.join(' ') : "'*'";
    for (const { type, statusCode } of responses) {
      const responseId = toPascal(`${this.props.prefix}-GatewayResponse-${type.responseType}`);

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
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'true'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
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