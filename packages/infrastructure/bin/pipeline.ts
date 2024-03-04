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
  let local_branch = (await getLocalGitBranch()).toString();
  const branch = (local_branch.match(/^dev/) !== null) ?
    "development" :
    (local_branch.match(/^prod/) !== null) ?
    "production" :
      local_branch;
  const config = getConfig(branch);
  const { client, stage, artifactBucketName, repo, testing } = config;

  const sourceConfig = {
    repo,
    authentication: cdk.SecretValue.secretsManager('github-token'),
  };

  console.log("Deploy pipeline from git branch:", branch);

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
    integrationConfig: {
      userName: testing?.username || '',
      password: testing?.password || '',
    },
  });
};

main();
