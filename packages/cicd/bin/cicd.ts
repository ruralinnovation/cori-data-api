#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CICDProps, CICDStack } from '../lib/CICDStack';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';

// LSW @TODO: Remove
const defaultEnv = { account: '857240696749', region: 'us-east-1' };

// Merging Futures
// const defaultEnv = { account: '190686435752', region: 'us-east-1' };

const sourceConfig = {
  repo: 'mergingfutures/cori-data-api',
  // @todo: change this for merging futures
  authentication: cdk.SecretValue.secretsManager('mergingfutures-pat'),
  // @todo: Need more permissions to use WEBHOOK
  trigger: GitHubTrigger.POLL
}

const cicdProps: CICDProps = {
  env: defaultEnv,
  environmentConfigs: {
    dev: {
      env: defaultEnv,
      client: 'cori',
      stage: 'dev',
      project: 'data-api',
      source:{
        ...sourceConfig,
        branch: 'dev'
      }
    },
    qa: {
      env: defaultEnv,
      client: 'cori',
      stage: 'qa',
      project: 'data-api',
      source:{
        ...sourceConfig,
        branch: 'qa'
      }
    },
    prod: {
      env: defaultEnv,
      client: 'cori',
      stage: 'prod',
      project: 'data-api',
      source:{
        ...sourceConfig,
        branch: 'prod'
      }
    },
  },
};
const app = new cdk.App();

new CICDStack(app, 'CoriDataApiCICDStack', cicdProps);
