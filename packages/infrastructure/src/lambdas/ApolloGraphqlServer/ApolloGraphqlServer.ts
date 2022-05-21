import { Aws, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvConfigVars } from './EnvConfig';
import { CognitoUserPoolsAuthorizer, IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { ApiNodejsFunction } from '../../../constructs/lambda';

interface ApolloGraphqlServerProps {
  prefix: string;
  logRetention: RetentionDays;
  environment: EnvConfigVars;
  api: IRestApi;
  authorizor?: CognitoUserPoolsAuthorizer;
}

export class ApolloGraphqlServer extends Construct {
  function: Function;
  role: Role;
  constructor(scope: Construct, id: string, props: ApolloGraphqlServerProps) {
    super(scope, id);

    const { prefix, logRetention, environment, api, authorizor } = props;

    const functionName = `${prefix}-apollo-server`;

    this.role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    this.function = new ApiNodejsFunction(this, 'handler', {
      environment,
      api: api,
      enableCORS: true,
      authorizer: authorizor || undefined,
      paths: {
        '/graphql': ['GET', 'POST'],
      },
    });

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logRetention,
    });

    this.function.addToRolePolicy(
      new PolicyStatement({
        sid: 'cloudwatch',
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}:*`,
          `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}:*:*`,
        ],
      })
    );
  }
}
