#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack, ApiStackProps, ApiStackBaseProps } from '../lib';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { getConfig } from '../../../config/config';
import * as ssm from 'aws-cdk-lib/aws-ssm';

// Grab environment specific ENV VARS file for DB access

// require('dotenv').config({
//   path: path.join(__dirname, `../../env.${process.env.NODE_ENV}`),
// });

// console.log(process.env);

/**
 * This is the local development entry-point when using `npm start`
 * See `./example.ts` or `./index.ts` for common configurations
 *
 * This setup is a little different because we must synth and run the ApiStack locally.
 * Typically those resources are included as a Nested Stack.
 */
const main = async () => {
  const app = new App();

  const config = getConfig(app.node.tryGetContext('config'));
  const prefix = `${config.client}-data-api-${config.stage}`;

  /**
   * This is the local api stack
   */
  const apiProps: ApiStackBaseProps = {
    ...config,
    userPoolId: config.startApiUserPoolId as string,
    // assets: Code.fromAsset('./dist/assets'),
    loggingLevel: 'debug',
  };

  new ApiStack(app, `${prefix}`, apiProps);

  createSamTemplate(app, {
    ...apiProps,
  });
};

/**
 * This generates a SAM compatible template so that you can debug locally with `npm start`.
 */
const createSamTemplate = (app: App, options: ApiStackBaseProps) => {
  console.log('Creating template');
  // Generate a template.yaml and local.json to be used with `npm start`
  const stacks = app.synth().stacks;
  const stack = stacks[0];
  fs.writeFileSync(path.resolve('./cdk.out/template.yml'), YAML.stringify(stack.template));

  const resources = stack.template.Resources;
  const functions = Object.keys(resources).filter(r => resources[r].Type === 'AWS::Lambda::Function');

  console.log(functions);

  const env = {} as any;
  functions.forEach(f => {
    env[f] = {
      LOGGING_LEVEL: options.loggingLevel,
      STAGE: 'local',
      DB_USER: options.databaseConfig.dbuser,
      REGION: options.env.region,
      DB_HOST: options.databaseConfig.host,
      DB_NAME: options.databaseConfig.dbname,
    };
  });

  fs.writeFileSync(path.resolve('./cdk.out/env.json'), JSON.stringify(env, null, 2));
};

main();
