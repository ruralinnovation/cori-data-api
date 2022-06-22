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
  trigger: GitHubTrigger.WEBHOOK,
};

// Each pipeline creates a new bucket, which can push us past the bucket quota. This allows us to re-use an existing one.
// @todo: create a bucket with a prettier name
const artifactBucketName = 'coridataapicicdstack-devpipelineartifactsbucketfd-1smu59goaufdm';

/**
 * Helper for building a pipeline
 * @param stage Which stage configuration to use from Configs
 * @param branch Which repo branch to bind to. If blank, will default to stage.
 * @returns 
 */
function buildPipeline(stage: string, branch?: string): PipelineStack {
  return new PipelineStack(app, `CoriDataApiPipeline-${stage}`, {
    env: defaultEnv,
    artifactBucketName,
    source: {
      ...sourceConfig,
      branch: branch || stage
    },
    ApiConfig: getConfig(stage),
  });
}

/**
 * Create pipelines per branch/stage here.
 * You can use cross account deploys to push build in the MF account and deploy to CORI
 *  - Alternatively, you can deploy the CORI pipelines to their account by changing the defaultEnv
 */

buildPipeline('ib-dev', 'refactor/ibliskavka-pipelines')

// buildPipeline('dev', 'dev')
// buildPipeline('qa', 'qa')
// buildPipeline('prod', 'main')