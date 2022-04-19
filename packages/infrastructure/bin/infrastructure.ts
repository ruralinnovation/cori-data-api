#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack, ApiStackProps } from "../lib/ApiStack";

const app = new cdk.App();

const apiParams: ApiStackProps = {
  client: "cori",
  stage: "dev",
  loggingLevel: "info",
  retain: false,
  env: {
    account: "190686435752",
    region: "us-east-1",
  },
};
new ApiStack(app, "ApiStack", apiParams);
