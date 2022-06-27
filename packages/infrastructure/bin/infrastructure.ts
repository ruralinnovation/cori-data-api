#!/usr/bin/env node

import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack } from '../lib';
import { getConfig } from '../../../config';

const app = new App();

const config = getConfig(app.node.tryGetContext('config'));
new ApiStack(app, `${config.client}-data-api-${config.stage}`, {
  ...config,
});
