#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../src/stacks/PipelineStack';
import { getConfig, getLocalGitBranch } from '../../../config';

const app = new cdk.App();

/**
 * @todo: Change this when handing over to client, or read it from configs
 */
const sourceConfig = {
  repo: 'mergingfutures/cori-data-api',
  authentication: cdk.SecretValue.secretsManager('github-token'),
};

const main = async () => {
  const branch = await getLocalGitBranch();
  const config = getConfig(branch);
  const { client, stage, artifactBucketName } = config;
  new PipelineStack(app, `${client}-CoriDataApiPipeline-${stage}`, {
    /**
     * Where to deploy the pipeline.
     */
    env: config.env,
    artifactBucketName,
    source: {
      ...sourceConfig,
      branch,
    },
    ApiConfig: config,
  });
};

main();
