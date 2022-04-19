import { Construct } from "constructs";
import {
  AwsIntegration,
  RestApi,
  CognitoUserPoolsAuthorizer,
  IResource,
  ApiKey,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";

import * as lambda from "aws-cdk-lib/aws-lambda";

export type HttpMethod = "GET" | "PUT" | "POST" | "DELETE" | "OPTIONS";

export interface ApiProps {
  prefix: string;
  stage: string;

  /**
   * Automatically configure configure CloudWatch role
   */
  cloudWatchRole: boolean;
}

export class Api extends Construct {
  api: RestApi;
  authorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, private props: ApiProps) {
    super(scope, id);

    this.api = new RestApi(this, "RestApi", {
      restApiName: props.prefix,
      cloudWatchRole: props.cloudWatchRole,
    });

    const key = this.api.addApiKey(`${props.prefix}-api-key`);
    const plan = this.api.addUsagePlan("UsagePlan", {
      name: "Easy",
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });
    plan.addApiKey(key);
  }

  attachCognitoAuthorizer(userPool: IUserPool) {
    this.authorizer = new CognitoUserPoolsAuthorizer(this, "cognitoAuth", {
      cognitoUserPools: [userPool],
      authorizerName: "CognitoAuth",
    });
    this.authorizer._attachToApi(this.api);
  }

  addMethod(resource: IResource, method: HttpMethod, functionArn: string) {
    // LambdaIntegration adds individual invoke permissions which bloats the lambda resource policy with sourceArns.
    // Using AwsIntegration since we already granted an invoke, so no need to pass in invokes with sourceArn
    const integration = new AwsIntegration({
      proxy: true,
      service: "lambda",
      path: `2015-03-31/functions/${functionArn}/invocations`,
    });

    if (this.authorizer && method !== "OPTIONS") {
      resource.addMethod(method, integration);

      //resource.addMethod(method, integration, { authorizer: this.authorizer });
    } else {
      resource.addMethod(method, integration);
    }
  }

  addLambdaPaths(
    func: lambda.Function,
    config: { [name: string]: HttpMethod[] }
  ) {
    Object.keys(config).forEach((path) => {
      const resource = this.api.root.resourceForPath(
        path.startsWith("/") ? path : `/${path}`
      );

      config[path].forEach((method) => {
        this.addMethod(resource, method, func.functionArn);
      });

      if (this.props.stage === "local") {
        // Add mapping for CORS Preflight. Mock integrations dont work with sam start-api
        this.addMethod(resource, "OPTIONS", func.functionArn);
      }
    });
  }
}
