import { Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { ApiBaseStack, ApiStackBaseProps } from './ApiStackBase';
import * as fs from 'fs';

export interface ApiStackProps extends Omit<ApiStackBaseProps, 'assets'> {}
export class ApiStack extends ApiBaseStack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.build({
      ...props,
    });
  }
}
