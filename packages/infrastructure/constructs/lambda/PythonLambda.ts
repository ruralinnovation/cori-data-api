import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import {
  LogGroup,
  LogGroupProps,
  RetentionDays,
  CfnLogGroup,
} from "aws-cdk-lib/aws-logs";
import {
  IRole,
  Role,
  CfnRole,
  RoleProps,
  PrincipalBase,
  ServicePrincipal,
  Policy,
  PolicyProps,
  CfnPolicy,
  ArnPrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  PythonFunction,
  PythonFunctionProps,
} from "@aws-cdk/aws-lambda-python-alpha";
import { CannedStatements } from "../CannedStatement";
import { Permission } from "aws-cdk-lib/aws-lambda";

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

/**
 * Creates and configures
 */
export class PythonLambda extends Construct {
  function: PythonFunction;

  constructor(scope: Construct, id: string, props: PythonLambdaProps) {
    super(scope, id);

    this.function = new PythonFunction(this, "Function", {
      ...props,
    });

    new LogGroup(this, "LogGroup", {
      logGroupName: `/aws/lambda/${this.function.functionName}`,
      removalPolicy: props.logRemovalPolicy || RemovalPolicy.DESTROY,
      retention: props.logRetention || RetentionDays.TWO_WEEKS,
    });
  }
}
