#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CICDProps, CICDStack } from '../lib/CICDStack';

const cicdProps: CICDProps = {
  environments: [
    {
      env: { account: '190686435752', region: 'us-east-1' },
      client: 'cori',
      stage: 'dev',
      branch: 'dev',
      repo: 'mergingfutures/cori-data-api',
      project: 'data-api',
    },
    {
      env: { account: '190686435752', region: 'us-east-1' },
      client: 'cori',
      stage: 'qa',
      branch: 'qa',
      repo: 'mergingfutures/cori-data-api',
      project: 'data-api',
    },
  ],
};
const app = new cdk.App();

new CICDStack(app, 'CoriDataApiCICDStack', cicdProps);
