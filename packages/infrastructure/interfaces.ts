import { S3EventSource, DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime, Function as Lambda, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Environment } from 'aws-cdk-lib';
import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IVpc, ISecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';

export const httpMethods = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = typeof httpMethods[number];
export function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === 'string' && httpMethods.includes(value.toUpperCase() as HttpMethod);
}

export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};
export interface Stage {
  name: string;
  region: string;
  account: string;
  connectInstanceId: string;
}
export interface BaseProps {
  projectName: string;
  ProjectName: string;
  stage: string;
  Stage: string;
  env: Environment;
}
export interface ResourceMethods {
  GET?: Lambda;
  POST?: Lambda;
  PUT?: Lambda;
  PATCH?: Lambda;
  DELETE?: Lambda;
  OPTION?: Lambda;
  HEAD?: Lambda;
}
export type ApiResource = { [segment: string]: ResourceMethods | ApiResource };

interface ApiEvent {
  type?: 'api';
  path: string;
  method: HttpMethod;
}

export const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;
export type LogLevel = typeof logLevels[number];
export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && logLevels.includes(value as LogLevel);
}

export interface LambdaDefinition {
  name: string;
  handler: string;
  table?: string;
  tableEnvKey?: string;
  policyStatements?: PolicyStatement[];
  runtime?: Runtime; // defaults to Runtime.NODEJS_12_X
  connectInvocable?: boolean;
  rolesThatCanInvoke?: IRole[];
  description?: string;
  events?: (ApiEvent | S3EventSource | DynamoEventSource)[];
  environment?: { [key: string]: string };
  vpc?: IVpc;
  retryAttempts?: number;
  securityGroups?: ISecurityGroup[];
  lambdaTimeout?: number;
  code?: string;
  lambdaLoggingLevel?: LogLevel;
  logRetention?: RetentionDays;
  provisionedConcurrency?: number;
  layer?: LayerVersion;
  vpcSubnets?: SubnetSelection;
  memorySize?: number;
  role?: IRole;
}
