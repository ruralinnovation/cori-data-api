import { AwsIntegration, CognitoUserPoolsAuthorizer, IResource } from 'aws-cdk-lib/aws-apigateway';
import { HttpMethod } from '../../interfaces';

/**
 * Configure the path/method integration for an API Lambda.
 */
export const addApiMethod = (
  resource: IResource,
  method: HttpMethod,
  functionArn: string,
  authorizer?: CognitoUserPoolsAuthorizer
) => {
  // LambdaIntegration adds individual invoke permissions which bloats the lambda resource policy with sourceArns.
  // Using AwsIntegration since we already granted an invoke, so no need to pass in invokes with sourceArn
  const integration = new AwsIntegration({
    proxy: true,
    service: 'lambda',
    path: `2015-03-31/functions/${functionArn}/invocations`
  });

  if (method === 'OPTIONS') {
    // CORS Preflight does not use auth
    resource.addMethod(method, integration);
  } else {
    resource.addMethod(method, integration, { authorizer });
  }
};
