import { Construct } from "constructs";
import {
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  IRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { PythonLambda, PythonLambdaProps } from "./PythonLambda";
import { Api } from "../api";

type HttpMethod = "GET" | "PUT" | "POST" | "DELETE" | "OPTIONS";

export interface ApiLambdaProps extends PythonLambdaProps {
  api: Api;
}

/**
 * Configures lambda for API GW execution ad provides syntax sugar for binding paths.
 */
export class ApiLambda extends PythonLambda {
  constructor(scope: Construct, id: string, protected props: ApiLambdaProps) {
    super(scope, id, props);

    this.function.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
  }

  private addMethod(method: HttpMethod, path: string): ApiLambda {
    const resource = this.props.api.api.root.resourceForPath(
      path.startsWith("/") ? path : `/${path}`
    );

    // LambdaIntegration adds individual invoke permissions which bloats the lambda resource policy with sourceArns.
    // Using AwsIntegration since we already granted an invoke, so no need to pass in invokes with sourceArn
    const integration = new AwsIntegration({
      proxy: true,
      service: "lambda",
      path: `2015-03-31/functions/${this.function.functionArn}/invocations`,
    });

    resource.addMethod(method, integration, {
      authorizer: this.props.api.authorizer,
    });

    return this;
  }

  addPath(path: string, ...methods: HttpMethod[]): ApiLambda {
    methods.forEach((method) => {
      this.addMethod(method, path);
    });
    return this;
  }

  addPaths(config: { [name: string]: HttpMethod[] }): ApiLambda {
    Object.keys(config).forEach((path) => {
      this.addPath(path, ...config[path]);
    });
    return this;
  }
}
