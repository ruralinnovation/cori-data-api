import { Construct } from 'constructs';
import { nanoid } from 'nanoid';
import { RemovalPolicy, Duration, Fn } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { LogGroup, LogGroupProps, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { S3EventSource, DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Role, ServicePrincipal, Policy, PolicyStatement, IRole, IPolicy, ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Function as Lambda, AssetCode, Runtime, LayerVersion, FunctionProps } from 'aws-cdk-lib/aws-lambda';

import { LambdaDefinition, LogLevel } from '../interfaces';
import { toKebab, toPascal } from './naming';
import { HttpMethod } from '../interfaces';
import { DynamoTables } from './DynamoTables';
import { CannedStatements } from './CannedStatement';

export interface LambdasAndLogGroupsProps {
  code: string;
  connectInstanceId?: string;
  connectInvocable?: boolean;
  environment?: { [key: string]: string };
  lambdaLoggingLevel?: LogLevel;
  logRetention?: RetentionDays;
  lambdas: LambdaDefinition[];
  lambdaTimeout?: number;
  layer?: LayerVersion;
  memorySize?: number;
  policyStatements?: PolicyStatement[];
  prefix: string;
  provisionedConcurrency?: number;
  retryAttempts?: number;
  rolesThatCanInvoke?: IRole[];
  runtime?: Runtime;
  securityGroups?: ISecurityGroup[];
  tables?: DynamoTables;
  vpc?: IVpc;
  vpcSubnets?: SubnetSelection;
}

const defaultLambdaProps = {
  lambdaLoggingLevel: 'INFO',
  lambdaTimeout: 10,
} as const;
interface LambdaResources {
  lambda: Lambda;
  logGroup: LogGroup;
  role?: IRole;
  policy?: IPolicy;
}

type BuildResourcesProps = FunctionProps &
  LogGroupProps & {
    prefix: string;
    name: string;
    layer?: LayerVersion;
    policyStatements: PolicyStatement[];
    rolesThatCanInvoke: IRole[];
    connectInstanceId?: string;
    connectInvocable?: boolean;
  };

interface AddLambdaPermissionsProps {
  pascalName: string;
  connectInstanceId?: string;
  connectInvocable?: boolean;
  rolesThatCanInvoke: IRole[];
  lambda: Lambda;
}

interface RoleProps {
  role?: IRole;
  kebabName: string;
  pascalName: string;
  logGroup: LogGroup;
  policyStatements: PolicyStatement[];
  vpc?: IVpc;
}

export class LambdasAndLogGroups extends Construct {
  public apiResources?: Map<{ path: string; method: HttpMethod }, Lambda>;
  public lambdas: Map<string, LambdaResources> = new Map();

  constructor(
    scope: Construct,
    id: string,
    {
      prefix,
      tables,
      code,
      lambdas,
      connectInstanceId,
      connectInvocable: globalConnectInvocable,
      environment: globalEnvironment = {},
      logRetention: globalLogRetention,
      lambdaLoggingLevel: globalLambdaLoggingLevel = defaultLambdaProps.lambdaLoggingLevel,
      lambdaTimeout: globalLambdaTimeout = defaultLambdaProps.lambdaTimeout,
      layer: globalLayer,
      memorySize: globalMemorySize,
      policyStatements: globalPolicyStatements = [],
      provisionedConcurrency: globalProvisionedConcurrency,
      retryAttempts: globalRetryAttempts,
      rolesThatCanInvoke: globalRolesThatCanInvoke = [],
      runtime: globalRuntime = Runtime.NODEJS_12_X,
      securityGroups: globalSecurityGroups,
      vpc: globalVpc,
      vpcSubnets: globalVpcSubnets,
    }: LambdasAndLogGroupsProps
  ) {
    super(scope, id);
    const assetCode: AssetCode = new AssetCode(code);
    for (const {
      name,
      description,
      handler,
      events,
      code: handlerCode,
      connectInvocable: handlerConnectInvocable,
      environment: handlerEnvironment = {},
      logRetention: handlerLogRetention,
      lambdaLoggingLevel: handlerLambdaLoggingLevel,
      lambdaTimeout: handlerLambdaTimeout,
      layer: handlerLayers,
      memorySize: handlerMemorySize,
      role: handlerRole,
      policyStatements: handlerPolicyStatements = [],
      provisionedConcurrency: handlerProvisionedConcurrency,
      retryAttempts: handlerRetryAttempts,
      rolesThatCanInvoke: handlerRolesThatCanInvoke = [],
      runtime: handlerRuntime,
      securityGroups: handlerSecurityGroups,
      table,
      tableEnvKey,
      vpc: handlerVpc,
      vpcSubnets: handlerVpcSubnets,
    } of lambdas) {
      const environment: { [key: string]: string } = {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        LOGGING_LEVEL: handlerLambdaLoggingLevel || globalLambdaLoggingLevel,
        ...globalEnvironment,
        ...handlerEnvironment,
      };
      if (connectInstanceId) {
        environment.CONNECT_INSTANCE_ID = connectInstanceId;
      }
      const { lambda, role } = this.buildResources({
        prefix,
        name,
        description,
        handler,
        environment,
        connectInstanceId,
        role: handlerRole,
        rolesThatCanInvoke: [...handlerRolesThatCanInvoke, ...globalRolesThatCanInvoke],
        connectInvocable: handlerConnectInvocable ?? globalConnectInvocable,
        policyStatements: [...handlerPolicyStatements, ...globalPolicyStatements],
        code: handlerCode ? new AssetCode(handlerCode) : assetCode,
        timeout: Duration.seconds(handlerLambdaTimeout ?? globalLambdaTimeout),
        layer: handlerLayers ?? globalLayer,
        runtime: handlerRuntime ?? globalRuntime,
        logRetention: handlerLogRetention ?? globalLogRetention,
        memorySize: handlerMemorySize ?? globalMemorySize,
        reservedConcurrentExecutions: handlerProvisionedConcurrency ?? globalProvisionedConcurrency,
        retryAttempts: handlerRetryAttempts ?? globalRetryAttempts,
        securityGroups: handlerSecurityGroups ?? globalSecurityGroups,
        vpc: handlerVpc ?? globalVpc,
        vpcSubnets: handlerVpcSubnets ?? globalVpcSubnets,
      });
      /**
       *
       * Add handler to applicable api routes and
       * add permissions to access dynamodb table
       *
       */
      if (table) {
        const _table = tables?.resources[table];
        if (_table) {
          lambda.addEnvironment(tableEnvKey ?? 'TABLE_NAME', _table.tableName);
          if (!handlerRole) {
            _table.grantReadWriteData(role as IRole);
          }
        }
      }
      if (events?.length) {
        for (const event of events) {
          if (event instanceof S3EventSource || event instanceof DynamoEventSource) {
            lambda.addEventSource(event);
            continue;
          }
          if (!this.apiResources) {
            this.apiResources = new Map();
          }
          this.apiResources.set({ method: event.method, path: event.path }, lambda);
        }
      }
    }
  }

  buildResources(props: BuildResourcesProps) {
    const PROD = props.prefix.split('-').pop() === 'prod';
    const { prefix, name, logRetention, layer, runtime } = props;
    const kebabName: string = `${prefix}-${toKebab(name)}`;
    const pascalName: string = toPascal(prefix) + toPascal(name);

    const logGroup: LogGroup = new LogGroup(this, `${pascalName}LogGroup`, {
      ...props,
      logGroupName: `/aws/lambda/${kebabName}`,
      removalPolicy: PROD ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      retention: logRetention,
    });

    const { role, policy } = this.buildIam({
      role: props.role,
      kebabName,
      pascalName,
      logGroup,
      vpc: props.vpc,
      policyStatements: props.policyStatements,
    });

    const lambda = new Lambda(this, pascalName, {
      ...props,
      role,
      functionName: kebabName,
    });
    if (layer && layer.compatibleRuntimes?.filter(rt => rt.runtimeEquals(runtime))) {
      lambda.addLayers(layer);
    }
    this.addLambdaPermissions({
      pascalName,
      lambda,
      rolesThatCanInvoke: props.rolesThatCanInvoke,
      connectInvocable: props.connectInvocable,
      connectInstanceId: props.connectInstanceId,
    });
    if (policy) {
      lambda.node.addDependency(policy);
    }

    this.lambdas.set(name, { role, policy, lambda, logGroup });
    return { lambda, role };
  }

  buildIam(props: RoleProps) {
    if (props.role) {
      return { role: props.role };
    }
    const { pascalName, kebabName, logGroup, policyStatements, vpc } = props;

    const role: Role = new Role(this, `${pascalName}Role`, {
      roleName: kebabName.substr(0, 64),
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    const policy: Policy = new Policy(this, `${pascalName}Policy`, {
      policyName: props.kebabName.substr(0, 64),
      roles: [role],
      statements: [
        new PolicyStatement({
          actions: ['logs:DescribeLogStreams', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [logGroup.logGroupArn],
        }),
        ...policyStatements,
      ],
    });
    policy.node.addDependency(role);

    if (vpc) {
      policy.addStatements(CannedStatements.vpcLambda());
    }

    return { role, policy };
  }

  addLambdaPermissions({
    lambda,
    rolesThatCanInvoke,
    connectInstanceId,
    connectInvocable,
    pascalName,
  }: AddLambdaPermissionsProps) {
    if (rolesThatCanInvoke.length) {
      for (const invokeRole of rolesThatCanInvoke) {
        lambda.addPermission(`${pascalName}InvokePolicy${nanoid(4)}`, {
          principal: new ArnPrincipal(invokeRole.roleArn),
          action: 'lambda:InvokeFunction',
        });
      }
    }
    if (connectInvocable && connectInstanceId) {
      lambda.addPermission(`${pascalName}ConnectPermission`, {
        principal: new ServicePrincipal('connect.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: Fn.sub('arn:aws:connect:${AWS::Region}:${AWS::AccountId}:instance/${connectInstanceId}', {
          connectInstanceId,
        }),
      });
    }
  }
}
