import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { PolicyDocument, PolicyDocumentProps } from 'aws-cdk-lib/aws-iam';
import { CannedStatements } from '../CannedStatement';

/**
 * Document builder using a fluent API.
 * Purpose: Encapsulate common Lambda Role policy features
 *
 * Example:
 *  const policy = new LambdaPolicyBuilder(...)
 *    .addLogging(...)
 *    .addDynamoDbRead(...)
 */
export class LambdaPolicyBuilder extends PolicyDocument {
  stack: Stack;
  constructor(private scope: Construct, vpc: boolean, props?: PolicyDocumentProps) {
    super(props);
    this.stack = Stack.of(scope);
    if (vpc) {
      this.addVpc();
    }
  }

  addDynamoDbRead(tableName: string, kmsCmkId?: string): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.dynamoDbRead(this.scope, tableName));
    if (kmsCmkId) {
      this.addKmsUsage(kmsCmkId);
    }
    return this;
  }

  addDynamoWrite(tableName: string, kmsCmkId?: string): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.dynamoWrite(this.scope, tableName));
    if (kmsCmkId) {
      this.addKmsUsage(kmsCmkId);
    }
    return this;
  }

  addDynamoDbCrud(tableName: string, kmsCmkId?: string): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.dynamoDbCrud(this.scope, tableName));
    if (kmsCmkId) {
      this.addKmsUsage(kmsCmkId);
    }
    return this;
  }

  addKmsUsage(kmsId: string): LambdaPolicyBuilder {
    const arn = `arn:aws:kms:${this.stack.region}:${this.stack.account}:key/${kmsId}`;
    return this.allow(['kms:GenerateDataKey', 'kms:Decrypt'], arn);
  }

  addLogging(logGroup: string): LambdaPolicyBuilder {
    const stack = Stack.of(this.scope);
    return this.allow(
      ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${logGroup}:*`
    );
  }

  addS3Crud(bucketName: string): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.s3Crud(this.scope, bucketName));
    return this;
  }

  private addVpc(): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.vpcLambda());
    return this;
  }

  allow(actions: string[] | string, resource: string[] | string): LambdaPolicyBuilder {
    this.addStatements(CannedStatements.allowStatement(actions, resource));
    return this;
  }
}
