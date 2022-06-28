import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { HasIdOverride } from '../../models';

export interface MFNodejsFunctionProps extends NodejsFunctionProps, HasIdOverride {
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
    const { logRetention, logicalIdOverride } = props;

    super(scope, id, {
      ...props,
      logRetention: logRetention || RetentionDays.TWO_WEEKS
    });

    if (logicalIdOverride) {
      (this.node.defaultChild as CfnFunction).overrideLogicalId(logicalIdOverride);
    }
  }
}
