import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { mergeSchemas } from '@graphql-tools/schema';
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, printSchema } from 'graphql';
import GeoJSON from './schema/geojson';
import { bcatQueries } from './schema/bcatQueries';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    setup: {
      type: GeoJSON.GeometryTypeUnion,
      args: undefined,
      resolve: async (_: any, __: any, { dataSources }: any) => {
        return true;
      },
    },
    feature_collection: {
      type: GeoJSON.FeatureCollectionObject,
      args: {
        table: {
          type: GraphQLString!,
        },
        counties: {
          type: new GraphQLList(GraphQLString),
        },
        state_abbr: {
          type: GraphQLString,
        },
        skipCache: {
          type: GraphQLBoolean,
        },
      },
      resolve: async (
        _: any,
        { table, state_abbr, counties, skipCache }: any,
        { dataSources, redisClient }: any,
        info: any
      ) => {
        if (state_abbr) {
          return skipCache
            ? await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`)
            : await redisClient.checkCache(`${table}-${state_abbr}`, async () => {
                return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`);
              });
        } else {
          if (!counties) {
            throw new Error('When no state abbr is specified you MUSt filter by state_abbr');
          }
          return await counties.reduce(
            async (fc, county) => {
              const featureCollection = await fc;
              const res: any = skipCache
                ? await redisClient.checkCache(`${table}-${county}`, async () => {
                    return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
                  })
                : await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
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
        }
      },
    },
    county_feature: {
      type: GeoJSON.FeatureCollectionObject,
      args: {
        table: {
          type: GraphQLString!,
        },
        county: {
          type: GraphQLString!,
        },
      },
      resolve: async (_: any, { table, county }: any, { dataSources, redisClient }: any, info: any) => {
        return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
        return await redisClient.checkCache(`${table}-${county}`, async () => {
          return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
        });
      },
    },
    ...bcatQueries,
  },
});

const schema = mergeSchemas({
  schemas: [
    new GraphQLSchema({
      query: RootQuery,
    }),
  ],
});

if (!existsSync('dist')) {
  mkdirSync('dist');
}
writeFileSync('dist/schema.graphql', printSchema(schema));
