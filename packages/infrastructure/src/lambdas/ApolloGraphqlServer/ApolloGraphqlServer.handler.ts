const { ApolloServer, gql, cac } = require('apollo-server-lambda');
const { GraphQLObjectType, GraphQLSchema, GraphQLScalarType } = require('graphql');
import { PythonRestApi } from './datasources';
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import GeoJSON from '../../../graphql/geojson';
import { EnvConfig } from './EnvConfig';
const { BaseRedisCache } = require('apollo-server-cache-redis');
import { ApolloServerPluginCacheControl } from 'apollo-server-core';
const Redis = require('ioredis');
import { Cache, checkCache } from './cache';
import { GraphQLList, GraphQLString } from 'graphql';
const compression = require('compression');
const express = require('express');

const cacheObj = new Cache();
const redisClient = cacheObj.getRawCache();
const redisCache = cacheObj.getCache();

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    setup: {
      type: GeoJSON.GeometryTypeUnion,
      args: null,
      resolve: async (_: any, __: any, { dataSources }: any) => {
        return true;
      },
    },
    auction_904_subsidy_awards: {
      type: GeoJSON.FeatureCollectionObject,
      args: null,
      resolve: async (_: any, __: any, { dataSources, redisClient }: any, info: any) => {
        info.cacheControl.setCacheHint({ maxAge: 60 });
        return await checkCache(redisClient, 'auction_904_subsidy_awards', async () => {
          return await dataSources.pythonApi.getItem('bcat/auction_904_subsidy_awards');
        });
      },
    },
    feature_collection: {
      type: GeoJSON.FeatureCollectionObject,
      args: {
        table: {
          type: GraphQLString,
        },
        counties: {
          type: new GraphQLList(GraphQLString),
        },
      },
      resolve: async (_: any, { table, counties }: any, { dataSources, redisClient }: any, info: any) => {
        return await counties.reduce(
          async (fc, county) => {
            const featureCollection = await fc;
            const res: any = await redisClient.checkCache(`${table}-${county}`, async () => {
              return await dataSources.pythonApi.getItem(`bcat/${table}?geoid_cos=[${county}]`);
            });
            if (res) {
              return {
                ...featureCollection,
                features: featureCollection.features.concat(res.features),
              };
            } else {
              return featureCollection;
            }
          },
          Promise.resolve({
            type: 'FeatureCollection',
            features: [],
          })
        );
      },
    },
    county_feature: {
      type: GeoJSON.FeatureCollectionObject,
      args: {
        table: {
          type: GraphQLString,
        },
        county: {
          type: GraphQLString,
        },
      },
      resolve: async (_: any, { table, county }: any, { dataSources, redisClient }: any, info: any) => {
        return await redisClient.checkCache(`${table}-${county}`, async () => {
          return await dataSources.pythonApi.getItem(`bcat/${table}?geoid_cos=[${county}]`);
        });
      },
    },
  },
});
const schema = mergeSchemas({
  schemas: [
    new GraphQLSchema({
      query: RootQuery,
    }),
  ],
});

/**
 * Custom Plugin Development
 */

const customPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  async requestDidStart(requestContext: any) {
    console.log('Request started! Query:\n' + requestContext.request.query);
    console.log('Request :\n' + JSON.stringify(requestContext.request));

    return {
      // Fires whenever Apollo Server will parse a GraphQL
      // request to create its associated document AST.
      async parsingDidStart(requestContext: any) {
        console.log('Parsing started!');
      },

      // Fires whenever Apollo Server will validate a
      // request's document AST against your GraphQL schema.
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
  plugins: [
    customPlugin,
    // responseCachePlugin({
    //   cache: redisCache,
    // }),
    // ApolloServerPluginCacheControl({
    //   // Cache everything for 1 second by default.
    //   defaultMaxAge: 60000,
    //   // Don't send the `cache-control` response header.
    //   calculateHttpHeaders: false,
    // }),
  ],
  // persistedQueries:
  //   EnvConfig.CACHE_ENABLED === 'true'
  //     ? {
  //         cache: redisCache,
  //       }
  //     : null,
  // cache: EnvConfig.CACHE_ENABLED === 'true' ? redisCache : null,
  context: ({ event, context, express, req }: any) => {
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
      redisClient: cacheObj,
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
