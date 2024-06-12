import { PythonRestApi } from './datasources';
import { Cache } from './cache';
import { ApolloServer } from 'apollo-server-lambda';
import { schema } from '@cori-risi/graphql-schemas';
import * as plugins from './plugins';
import { Handler } from "aws-lambda";
import * as AWS from 'aws-sdk';

// TODO: Add S3 fetch logic...
console.log({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
// TODO: Find a new way to set credentials for S3
// This method of setting creds is deprecated...
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

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

export const apolloConfig = {
  schema,
  csrfPrevention: false,
  playground: {
    endpoint: '/playground',
  },
  dataSources: () => ({
    pythonApi: new PythonRestApi(),
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

export const server = new ApolloServer(apolloConfig);

// export const handler: Handler = async (event) => {
//   const response = await s3.listBuckets().promise();
//   return response?.Buckets?.map((bucket) => bucket.Name);
// }

export const handler: Handler = server.createHandler({
  async expressAppFromMiddleware(middleware) {
    console.log('Setting up express middleware');

    const response = await s3.listBuckets().promise();
    console.log("List buckets:", response?.Buckets?.map((bucket) => bucket.Name));

    // TODO: Pass bucket list down to individual graphql queries

    const app = express();
    // app.use(compression());
    app.use(middleware);
    return app;
  },
});
