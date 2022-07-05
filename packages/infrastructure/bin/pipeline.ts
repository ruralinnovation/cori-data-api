#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../src/stacks/PipelineStack';
import { getConfig, getLocalGitBranch } from '../../../config';

const app = new cdk.App();

/**
 * @todo: Change this when handing over to client, or read it from configs
 */

const main = async () => {
  const branch = await getLocalGitBranch();
  const config = getConfig(branch);
  const { client, stage, artifactBucketName, repo, testing } = config;

  const sourceConfig = {
    repo,
    authentication: cdk.SecretValue.secretsManager('github-token'),
  };

  const integrationConfig = {
    userName: cdk.SecretValue.secretsManager('/cori/int-test-user-name').toString(),
    password: cdk.SecretValue.secretsManager('/cori/int-test-user-pw').toString(),
  };

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
    integrationConfig,
  });
};

main();
