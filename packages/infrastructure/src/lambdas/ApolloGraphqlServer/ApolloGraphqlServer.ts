import { Aws, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvConfigVars } from './EnvConfig';
import { CognitoUserPoolsAuthorizer, IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { ApiNodejsFunction } from '../../../constructs/lambda';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ApolloGraphqlServerProps {
  prefix: string;
  logRetention: RetentionDays;
  environment: EnvConfigVars;
}

export class ApolloGraphqlServer extends Construct {
  function: Function;
  role: Role;
  constructor(scope: Construct, id: string, props: ApolloGraphqlServerProps) {
    super(scope, id);

    const { prefix, logRetention, environment } = props;

    const functionName = `${prefix}-apollo-server`;

    this.role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    this.function = new NodejsFunction(this, 'handler', {
      ...props,
      memorySize: 256,
      runtime: Runtime.NODEJS_14_X,
      environment,
      functionName,
      timeout: Duration.seconds(40)
    });

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logRetention
    });

    this.function.addToRolePolicy(
      new PolicyStatement({
        sid: 'cloudwatch',
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}:*`,
          `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}:*:*`
        ]
      })
    );
  }
}
