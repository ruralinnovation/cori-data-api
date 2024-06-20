import { Logger } from '@aws-lambda-powertools/logger';
import { S3, S3ClientConfig } from "@aws-sdk/client-s3";
import { ApolloServer } from 'apollo-server-lambda';
import { schema } from '@cori-risi/graphql-schemas';
import { PythonRestApi } from './datasources';
import { Cache } from './cache';
import * as plugins from './plugins';
import { stringify } from "flatted";
import { BaseDataSource } from "./datasources/RestDataSources/BaseDataSource";

const logger = new Logger();

// Using "import * as express from 'express';" results in "express is not a function" once deployed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
// const compression = require('compression');  // Disable compression because:
                                                // AxiosError {
                                                //   code: 'Z_DATA_ERROR',
                                                //   errno: -3,
                                                //   message: 'incorrect header check',
                                                //   ...
                                                // }

const cache = new Cache();

const pythonApi = new PythonRestApi();
const s3_config: S3ClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.AWS_REGION,
};
const s3DataSource = new BaseDataSource();
(s3DataSource as any).config = s3_config;

const apolloConfig = {
  schema,
  csrfPrevention: false,
  playground: {
    endpoint: '/playground',
  },
  dataSources: () => ({
    pythonApi,
    s3DataSource
  }),
  plugins: Object.values(plugins).map(plugin => plugin),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: ({ event, context, express }: any) => {
    return {
      headers: event.headers,
      functionName: context.functionName,
      event,
      context,
      customHeaders: {
        headers: {
          'Authorization': event.headers ? event.headers.Authorization : '',
          'credentials': 'same-origin',
          'Content-Type': 'application/json',
        },
      },
      expressRequest: express.req,
      redisClient: cache,
    };
  },
  cors: {
    origin: ['*'],
    credentials: true,
  },
};

const server = new ApolloServer(apolloConfig);

export const handler = server.createHandler({
  expressAppFromMiddleware(middleware) {
    logger.info('Setting up express middleware');
    const app = express();
    // app.use(compression());

    logger.info(`AWS credentials: ${stringify(s3_config)}`);

    const s3 = new S3((s3DataSource as any).config);

    // TODO: Try to fetch list of buckets
    s3.listBuckets()
      .then(s3_bucket_list => {

        logger.info(`s3.listBuckets()...`);

        if (typeof s3_bucket_list.Buckets !== "object" || s3_bucket_list.Buckets?.length === 0) {
          logger.info(`No S3 buckets found`);
        } else {
          s3_bucket_list.Buckets.forEach(b => {
            logger.info(b.Name?.toString() || "");
          });
        }
      });

    app.use(middleware);

    return app;
  },
});
