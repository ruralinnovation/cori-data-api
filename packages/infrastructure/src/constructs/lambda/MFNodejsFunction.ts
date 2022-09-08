import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface MFNodejsFunctionProps extends NodejsFunctionProps {
  /**
   * Must provide at least logging level
   */
  environment: {
    /**
     * Enforce standard logging level prop
     */
    LOGGING_LEVEL: string;
    [name: string]: string;
  };

  /**
   * @default RetentionDays.TWO_WEEKS
   */
  logRetention?: RetentionDays;
}

/**
 * This is extending the base class rather than creating a new construct so that we can replace the native construct without changes.
 */
export class MFNodejsFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: MFNodejsFunctionProps) {
    const { logRetention } = props;

    super(scope, id, {
      ...props,
      logRetention: logRetention || RetentionDays.TWO_WEEKS,
    });
  }
}
