import { Construct } from 'constructs';
import { PolicyStatement, Effect, AccountPrincipal } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

/**
 * Provides common implementations for IAM policy statements
 * Implemented as a static builder so it can be re-used by other constructs
 *
 * Grants preferred, but this is better for building a role independently
 *
 * Based on: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-template-list.html#dynamo-db-write-policy
 */
export class CannedStatements {
  static dynamoDbRead(scope: Construct, tableName: string): PolicyStatement {
    const stack = Stack.of(scope);
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:BatchGetItem',
        'dynamodb:DescribeTable',
      ],
      resources: [
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}`,
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}/index/*`,
      ],
    });
  }

  static dynamoWrite(scope: Construct, tableName: string): PolicyStatement {
    const stack = Stack.of(scope);
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:BatchWriteItem'],
      resources: [
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}`,
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}/index/*`,
      ],
    });
  }

  static dynamoDbCrud(scope: Construct, tableName: string): PolicyStatement {
    const stack = Stack.of(scope);
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:DeleteItem',
        'dynamodb:PutItem',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
        'dynamodb:BatchWriteItem',
        'dynamodb:BatchGetItem',
        'dynamodb:DescribeTable',
        'dynamodb:ConditionCheckItem',
      ],
      resources: [
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}`,
        `arn:${stack.partition}:dynamodb:${stack.region}:${stack.account}:table/${tableName}/index/*`,
      ],
    });
  }

  /**
   * Typical KMS policy statements
   */
  static kmsDefault(accountId: any): PolicyStatement[] {
    const accountPrincipal = new AccountPrincipal(accountId);
    return [
      new PolicyStatement({
        sid: 'Allow root account to manage the key',
        effect: Effect.ALLOW,
        principals: [accountPrincipal],
        actions: [
          'kms:Create*',
          'kms:Describe*',
          'kms:Enable*',
          'kms:List*',
          'kms:Put*',
          'kms:Update*',
          'kms:Revoke*',
          'kms:Disable*',
          'kms:Get*',
          'kms:Delete*',
          'kms:ScheduleKeyDeletion',
          'kms:CancelKeyDeletion',
          'kms:TagResource',
        ],
        resources: ['*'],
      }),
      new PolicyStatement({
        sid: 'Allow access for all principals in the account that are authorized to use KMS',
        effect: Effect.ALLOW,
        principals: [accountPrincipal],
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      }),
      new PolicyStatement({
        sid: 'Allow principle to manage grants',
        effect: Effect.ALLOW,
        principals: [accountPrincipal],
        actions: ['kms:CreateGrant', 'kms:ListGrants', 'kms:RevokeGrant'],
        resources: ['*'],
        conditions: {
          Bool: {
            'kms:GrantIsForAWSResource': true,
          },
        },
      }),
    ];
  }

  static s3Crud(scope: Construct, bucketName: string): PolicyStatement {
    const stack = Stack.of(scope);
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:PutObjectAcl',
        's3:GetLifecycleConfiguration',
        's3:PutLifecycleConfiguration',
        's3:DeleteObject',
      ],
      resources: [`arn:${stack.partition}:s3:::${bucketName}`, `arn:${stack.partition}:s3:::${bucketName}/*`],
    });
  }

  /**
   * Required permissions to attach lambda to VPC
   */
  static vpcLambda(): PolicyStatement {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
        'ec2:AssignPrivateIpAddresses',
        'ec2:UnassignPrivateIpAddresses',
      ],
      resources: ['*'],
    });
  }

  static allowStatement(actions: string[] | string, resource: string[] | string): PolicyStatement {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: typeof actions === 'string' ? [actions] : actions,
      resources: typeof resource === 'string' ? [resource] : resource,
    });
  }
}
