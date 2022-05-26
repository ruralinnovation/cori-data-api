import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  Attribute,
  Table,
  CfnTable,
  TableProps,
  BillingMode,
  TableEncryption,
  GlobalSecondaryIndexProps,
  LocalSecondaryIndexProps,
} from 'aws-cdk-lib/aws-dynamodb';
import { toPascal } from './naming';

export type DynamoAttributeValue = typeof String | typeof Number | typeof Boolean | 'string' | 'number' | 'boolean';
export type DynamoAttribute = {
  [AttributeName: string]: DynamoAttributeValue;
};
export interface GlobalSecondaryIndexDefinition extends Omit<GlobalSecondaryIndexProps, 'partitionKey' | 'sortKey'> {
  partitionKey: DynamoAttribute;
  sortKey?: DynamoAttribute;
}
export interface LocalSecondaryIndexDefinition extends Omit<LocalSecondaryIndexProps, 'sortKey'> {
  sortKey: DynamoAttribute;
}
export interface DynamoDefinition extends Omit<TableProps, 'partitionKey' | 'sortKey' | 'tableName'> {
  name: string;
  logicalId?: string;
  partitionKey: DynamoAttribute;
  sortKey?: DynamoAttribute;
  lsi?: LocalSecondaryIndexDefinition[];
  gsi?: GlobalSecondaryIndexDefinition[];
}
export interface DynamoTablesProps {
  prefix?: string;
  definitions?: DynamoDefinition[];
}

export class DynamoTables extends Construct {
  public resources: { [tableName: string]: Table } = {};

  constructor(scope: Construct, id: string, private props: DynamoTablesProps) {
    super(scope, id);

    if (this.props.definitions?.length) {
      for (const tableProps of this.props.definitions) {
        this.addTable(tableProps);
      }
    }
  }

  public addTable(dynamoDefinition: DynamoDefinition) {
    const { name, logicalId, encryptionKey, encryption, lsi, gsi, removalPolicy } = dynamoDefinition;

    const tableId = logicalId ? logicalId : toPascal(name);
    const tableName = this.props.prefix ? `${this.props.prefix}-${name}` : name;

    const table = new Table(this, tableId, {
      ...dynamoDefinition,
      tableName,
      billingMode: dynamoDefinition.billingMode ?? BillingMode.PAY_PER_REQUEST,
      partitionKey: DynamoTables.parseKey(dynamoDefinition.partitionKey),
      sortKey: dynamoDefinition.sortKey ? DynamoTables.parseKey(dynamoDefinition.sortKey) : undefined,
      encryption: encryption ? encryption : encryptionKey ? TableEncryption.CUSTOMER_MANAGED : undefined,
      removalPolicy: removalPolicy ? removalPolicy : RemovalPolicy.DESTROY,
    });
    (table.node.defaultChild as CfnTable).overrideLogicalId(tableId);

    if (gsi) {
      for (const index of gsi) {
        table.addGlobalSecondaryIndex({
          ...index,
          partitionKey: DynamoTables.parseKey(index.partitionKey),
          sortKey: dynamoDefinition.sortKey ? DynamoTables.parseKey(dynamoDefinition.sortKey) : undefined,
        });
      }
    }
    if (lsi) {
      for (const index of lsi) {
        table.addLocalSecondaryIndex({
          ...index,
          sortKey: DynamoTables.parseKey(index.sortKey),
        });
      }
    }

    this.resources[name] = table;
  }

  public static getAttributeType(value: DynamoAttributeValue): AttributeType {
    switch (value) {
      case String:
        return AttributeType.STRING;
      case 'string':
        return AttributeType.STRING;
      case Number:
        return AttributeType.NUMBER;
      case 'number':
        return AttributeType.NUMBER;
      case Boolean:
        return AttributeType.BINARY;
      case 'boolean':
        return AttributeType.BINARY;
      default:
        throw new Error(`Unsupported attribute type: ${value}`);
    }
  }

  public static parseKey(attribute: DynamoAttribute): Attribute {
    const [partitionKeyName, partitionKeyValue] = Object.entries(attribute)[0];
    return {
      name: partitionKeyName,
      type: DynamoTables.getAttributeType(partitionKeyValue),
    };
  }
}
