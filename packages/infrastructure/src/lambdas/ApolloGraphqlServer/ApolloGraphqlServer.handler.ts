// @ts-nocheck -
const { ApolloServer, gql } = require('apollo-server-lambda');
const { GraphQLObjectType, GraphQLSchema, GraphQLScalarType } = require('graphql');
import { PythonRestApi } from './datasources';
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema';
import GeoJSON from '../../../graphql/geojson';

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
    hello: {
      type: GeoJSON.FeatureCollectionObject,
      args: null,
      resolve: async (_: any, __: any, { dataSources }: any) => {
        return dataSources.pythonApi.getItem();
      },
    },
    auction_904_subsidy_awards: {
      type: GeoJSON.FeatureCollectionObject,
      args: null,
      resolve: async (_: any, __: any, { dataSources }: any) => {
        return dataSources.pythonApi.getItem('bcat/auction_904_subsidy_awards');
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
const customPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  async requestDidStart(requestContext: any) {
    console.log('Request started! Query:\n' + requestContext.request.query);

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
  plugins: [customPlugin],
  // context: ({ event, context, express }: any) => ({
  //   headers: event.headers,
  //   functionName: context.functionName,
  //   event,
  //   context,
  //   expressRequest: express.req,
  // }),
  // Update this with necessary origins
  cors: {
    origin: ['*'],
  },
};

export const server = new ApolloServer(apolloConfig);

export const handler = server.createHandler();
