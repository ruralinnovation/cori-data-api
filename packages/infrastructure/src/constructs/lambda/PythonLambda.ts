import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PythonFunction, PythonFunctionProps } from '@aws-cdk/aws-lambda-python-alpha';

export interface PythonLambdaProps extends PythonFunctionProps {
  /**
   * If not provided, will default to DESTROY
   */
  logRemovalPolicy?: RemovalPolicy;
  /**
   * If not provided, will default to 2 weeks
   */
  logRetention?: RetentionDays;
}

export class PythonLambda extends Construct {
  function: PythonFunction;

  constructor(scope: Construct, id: string, props: PythonLambdaProps) {
    super(scope, id);

    this.function = new PythonFunction(this, 'Function', {
      ...props,
    });

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${this.function.functionName}`,
      removalPolicy: props.logRemovalPolicy || RemovalPolicy.DESTROY,
      retention: props.logRetention || RetentionDays.TWO_WEEKS,
    });
  }
}
