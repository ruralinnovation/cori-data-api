import { PythonRestApi } from './datasources';
import { Cache } from './cache';
import { ApolloServer } from 'apollo-server-lambda';
import compression from 'compression';
import { schema } from 'schemas/dist';
import * as plugins from './plugins';

// Using "import * as express from 'express';" results in "express is not a function" once deployed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

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

export const handler = server.createHandler({
  expressAppFromMiddleware(middleware) {
    console.log('Setting up express middleware');
    const app = express();
    app.use(compression());
    app.use(middleware);
    return app;
  },
});
