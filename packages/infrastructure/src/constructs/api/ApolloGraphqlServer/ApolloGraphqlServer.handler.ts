/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PythonRestApi } from './datasources';
import { mergeSchemas } from '@graphql-tools/schema';
import GeoJSON from './schema/geojson';
import { Cache } from './cache';
import { GraphQLBoolean, GraphQLList, GraphQLString, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { bcatQueries } from './schema/bcatQueries';
import { ApolloServer } from 'apollo-server-lambda';
import compression from 'compression';
import { schema } from 'schemas/dist';
// Using "import * as express from 'express';" results in "express is not a function" once deployed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

const cache = new Cache();

// const RootQuery = new GraphQLObjectType({
//   name: 'RootQueryType',
//   fields: {
//     setup: {
//       type: GeoJSON.GeometryTypeUnion,
//       args: undefined,
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       resolve: (_: any, __: any, { dataSources }: any) => {
//         return true;
//       },
//     },
//     feature_collection: {
//       type: GeoJSON.FeatureCollectionObject,
//       args: {
//         table: {
//           // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//           type: GraphQLString!,
//         },
//         counties: {
//           type: new GraphQLList(GraphQLString),
//         },
//         state_abbr: {
//           type: GraphQLString,
//         },
//         skipCache: {
//           type: GraphQLBoolean,
//         },
//       },
//       resolve: async (
//         _: any,
//         { table, state_abbr, counties, skipCache }: any,
//         { dataSources, redisClient }: any,
//         info: any
//       ) => {
//         if (state_abbr) {
//           return skipCache
//             ? await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`)
//             : await redisClient.checkCache(`${table}-${state_abbr}`, async () => {
//                 return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`);
//               });
//         } else {
//           if (!counties) {
//             throw new Error('When no state abbr is specified you MUSt filter by state_abbr');
//           }
//           return await counties.reduce(
//             async (fc, county) => {
//               const featureCollection = await fc;
//               const res: any = skipCache
//                 ? await redisClient.checkCache(`${table}-${county}`, async () => {
//                     return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
//                   })
//                 : await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
//               if (res) {
//                 return {
//                   ...featureCollection,
//                   features: featureCollection.features.concat(res.features),
//                 };
//               } else {
//                 return featureCollection;
//               }
//             },
//             Promise.resolve({
//               type: 'FeatureCollection',
//               features: [],
//             })
//           );
//         }
//       },
//     },
//     county_feature: {
//       type: GeoJSON.FeatureCollectionObject,
//       args: {
//         table: {
//           // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//           type: GraphQLString!,
//         },
//         county: {
//           // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//           type: GraphQLString!,
//         },
//       },
//       resolve: async (_: any, { table, county }: any, { dataSources, redisClient }: any, info: any) => {
//         return await redisClient.checkCache(`${table}-${county}`, async () => {
//           return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
//         });
//       },
//     },
//     ...bcatQueries,
//   },
// });
// const schema = mergeSchemas({
//   schemas: [
//     new GraphQLSchema({
//       query: RootQuery,
//     }),
//   ],
// });

/**
 * Custom Plugin Development
 * Tap into lifecycle hooks and add your custom code
 */

const customServerPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  // eslint-disable-next-line require-await
  async requestDidStart(requestContext: any) {
    console.log('Request started! Query:\n' + requestContext.request.query);
    console.log('Request :\n' + JSON.stringify(requestContext.request));

    return {
      // Fires whenever Apollo Server will parse a GraphQL
      // request to create its associated document AST.
      // eslint-disable-next-line require-await
      async parsingDidStart(requestContext: any) {
        console.log('Parsing started!');
      },

      // Fires whenever Apollo Server will validate a
      // request's document AST against your GraphQL schema.
      // eslint-disable-next-line require-await
      async validationDidStart(requestContext: any) {
        console.log('Validation started!');
      },
    };
  },
};

export const apolloConfig = {
  schema,
  csrfPrevention: false,
  playground: {
    endpoint: '/playground',
  },
  dataSources: () => ({
    pythonApi: new PythonRestApi(),
  }),
  plugins: [customServerPlugin],
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
