#!/usr/bin/env node

import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack } from '../src/stacks';
import { getConfig } from '../../../config/configs';
import { getLocalGitBranch } from '../../../config';

const main = async () => {
  const app = new App();

  const branch = await getLocalGitBranch();

  const config = getConfig(branch);

  new ApiStack(app, `${config.client}-data-api-${config.stage}`, {
    ...config,
  });
};

main();
