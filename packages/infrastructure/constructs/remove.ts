import { Construct } from 'constructs';
import {
  AwsIntegration,
  RestApi,
  CognitoUserPoolsAuthorizer,
  IResource,
  ApiKey,
  IApiKey
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { v4 as uuidv4 } from 'uuid';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS';

export interface ApiProps {
  prefix: string;
  stage: string;

  /**
   * Automatically configure configure CloudWatch role
   */
  cloudWatchRole: boolean;
  apiKey?: Secret;
}

export class Api extends Construct {
  api: RestApi;
  authorizer: CognitoUserPoolsAuthorizer;
  key: IApiKey;

  constructor(scope: Construct, id: string, private props: ApiProps) {
    super(scope, id);

    this.api = new RestApi(this, 'RestApi', {
      restApiName: props.prefix,
      cloudWatchRole: props.cloudWatchRole
    });

    if (props.apiKey) {
      const plan = this.api.addUsagePlan('PythonApiUsagePlan', {
        name: 'Development',
        throttle: {
          rateLimit: 10,
          burstLimit: 2
        }
      });
      const key = this.api.addApiKey('ApiKey', {
        apiKeyName: this.props.prefix + 'api-key',
        value: props.apiKey.secretValueFromJson(props.prefix + '-api-key').toString()
      });
      plan.addApiKey(key);
    }
  }

  attachCognitoAuthorizer(userPool: IUserPool) {
    this.authorizer = new CognitoUserPoolsAuthorizer(this, 'cognitoAuth', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuth'
    });
    this.authorizer._attachToApi(this.api);
  }

  addMethod(resource: IResource, method: HttpMethod, functionArn: string) {
    // LambdaIntegration adds individual invoke permissions which bloats the lambda resource policy with sourceArns.
    // Using AwsIntegration since we already granted an invoke, so no need to pass in invokes with sourceArn
    const integration = new AwsIntegration({
      proxy: true,
      service: 'lambda',
      path: `2015-03-31/functions/${functionArn}/invocations`
    });

    if (this.authorizer && method !== 'OPTIONS') {
      resource.addMethod(method, integration);

      //resource.addMethod(method, integration, { authorizer: this.authorizer });
    } else {
      resource.addMethod(method, integration);
    }
  }

  addLambdaPaths(func: lambda.Function, config: { [name: string]: HttpMethod[] }) {
    Object.keys(config).forEach(path => {
      const resource = this.api.root.resourceForPath(path.startsWith('/') ? path : `/${path}`);

      config[path].forEach(method => {
        this.addMethod(resource, method, func.functionArn);
      });

      if (this.props.stage === 'local') {
        // Add mapping for CORS Preflight. Mock integrations dont work with sam start-api
        this.addMethod(resource, 'OPTIONS', func.functionArn);
      }
    });
  }
}
