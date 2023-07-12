import { Duration } from 'aws-cdk-lib';
import { Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvConfigVars } from './EnvConfig';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { ApiGw } from '../ApiGw';

interface ApolloGraphqlServerProps {
  prefix: string;
  stage: string;
  userPool: IUserPool;
  logRetention: RetentionDays;
  environment: EnvConfigVars;
}

export class ApolloGraphqlServer extends Construct {
  readonly apiGw: ApiGw;
  readonly function: LambdaFunction;

  constructor(scope: Construct, id: string, props: ApolloGraphqlServerProps) {
    super(scope, id);

    const { prefix, stage, userPool, logRetention, environment } = props;

    /**
     * Typescript Apollo Server GraphQL Api
     */
    this.apiGw = new ApiGw(this, 'ApolloApi', {
      prefix: prefix + '-apollo-api',
      stage,
      // cloudWatchRole: this.iam.roles === undefined,
      cloudWatchRole: true,
      userPool,
    });

    const functionName = `${prefix}-apollo-server`;

    this.function = new NodejsFunction(this, 'handler', {
      ...props,
      memorySize: 256,
      runtime: Runtime.NODEJS_14_X,
      environment,
      functionName,
      timeout: Duration.seconds(40),
      logRetention: logRetention,
    });

    this.apiGw.addLambda({
      method: 'OPTIONS',
      path: '/graphql',
      lambda: this.function,
    });

    this.apiGw.addLambda({
      method: 'POST',
      path: '/graphql',
      lambda: this.function,
    });
  }
}
