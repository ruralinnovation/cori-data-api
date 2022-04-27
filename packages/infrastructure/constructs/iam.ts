import { Construct } from 'constructs';
import { IManagedPolicy, IPrincipal, IRole, PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';
import { LambdaPolicyBuilder } from './lambda/LambdaPolicyBuilder';
import { InterfaceVpcEndpoint } from 'aws-cdk-lib/aws-ec2';

export interface ApiIAMProps {
  prefix: string;
  vpc: boolean;
}

export interface ApiRoles {
  pythonLambdaRole: IRole;
}

export const injectableRole = (
  scope: Construct,
  id: string,
  assumedBy: IPrincipal,
  prefix: string,
  managedPolicies?: IManagedPolicy[],
  inlinePolicy?: PolicyDocument
): IRole => {
  // RoleName has a max length of 64.
  // Prefix is tokenized, so length is indeterminate
  return new Role(scope, id, {
    roleName: `${prefix}-${id}`,
    assumedBy: assumedBy,
    inlinePolicies: inlinePolicy ? { policy: inlinePolicy } : undefined,
    managedPolicies: managedPolicies,
  });
};
export const injectableLambdaRole = (scope: Construct, id: string, prefix: string, policy: PolicyDocument): IRole => {
  return injectableRole(scope, id, new ServicePrincipal('lambda.amazonaws.com'), prefix, undefined, policy);
};

/**
 * Defines the IAM roles used by the project.
 */
export class ApiIAM extends Construct {
  public roles: ApiRoles;

  constructor(scope: Construct, id: string, props: ApiIAMProps) {
    super(scope, id);

    this.roles = {} as any;

    const { prefix } = props;
    const stack = Stack.of(this);

    this.roles.pythonLambdaRole = injectableLambdaRole(
      this,
      'PythonApiRole',
      prefix,
      new LambdaPolicyBuilder(this, props.vpc).addLogging('*')
    );
  }
}
