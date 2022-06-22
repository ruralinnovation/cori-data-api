#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/PipelineStack';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { getConfig } from '../../../config/config';

const app = new cdk.App();

// Merging Futures
const defaultEnv = { account: '190686435752', region: 'us-east-1' };

const sourceConfig = {
  repo: 'mergingfutures/cori-data-api',
  authentication: cdk.SecretValue.secretsManager('github-token'),
  trigger: GitHubTrigger.POLL,
};

/**
 * Helper for building a pipeline
 * @param stage Which stage configuration to use from Configs
 * @param branch Which repo branch to bind to. If blank, will default to stage.
 * @returns 
 */
function buildPipeline(stage: string, branch?: string): PipelineStack {
  return new PipelineStack(app, `CoriDataApiPipeline-${stage}`, {
    env: defaultEnv,
    source: {
      ...sourceConfig,
      branch: branch || stage
    },
    ApiConfig: getConfig(stage),
  });
}

buildPipeline('ib-dev', 'refactor/ibliskavka-pipelines')

// buildPipeline('dev', 'dev')
// buildPipeline('qa', 'qa')
// buildPipeline('prod', 'main')