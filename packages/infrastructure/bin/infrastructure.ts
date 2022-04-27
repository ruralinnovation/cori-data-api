#!/usr/bin/env node

import 'source-map-support/register';
import { App, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { ApiStack, ApiBaseStack } from '../lib';
import { getConfig } from '../config/config';

const app = new App();

const config = getConfig(app.node.tryGetContext('config'));

new ApiBaseStack(app, `${config.client}-data-api-${config.stage}`, {
  ...config,
});
