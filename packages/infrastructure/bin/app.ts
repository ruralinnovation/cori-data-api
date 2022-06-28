#!/usr/bin/env node

import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack } from '../lib';
import { getConfig } from '../../../config/configs';
import { getLocalGitBranch } from '../../../config';

const main = async ()=>{
  
  const app = new App();

  // @todo: Get rid of the context variable in favor of branch name
  const configName = app.node.tryGetContext('config') || await getLocalGitBranch();

  const config = getConfig(configName);

  new ApiStack(app, `${config.client}-data-api-${config.stage}`, {
    ...config,
  });
}

main();
