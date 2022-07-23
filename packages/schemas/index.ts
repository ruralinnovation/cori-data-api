import { mergeSchemas } from '@graphql-tools/schema';
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import GeoJSON from './schema/geojson';
import * as queries from './schema/queries';

const combinedQueries = Object.values(queries).reduce((obj, query) => {
  return {
    ...obj,
    ...query,
  };
}, {});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    setup: {
      type: GeoJSON.GeometryTypeUnion,
      args: undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      resolve: (_: unknown, __: unknown, { dataSources }: any) => {
        return true;
      },
    },
    feature_collection: {
      type: GeoJSON.FeatureCollectionObject,
      args: {
        table: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        _: unknown,
        {
          table,
          state_abbr,
          counties,
          skipCache,
        }: {
          table: string;
          state_abbr: string;
          counties: string[];
          skipCache: boolean;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { dataSources, redisClient }: any,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        info: unknown
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          type: GraphQLString!,
        },
        county: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          type: GraphQLString!,
        },
      },
      resolve: async (
        _: unknown,
        { table, county }: { table: string; county: string },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { dataSources, redisClient }: any,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        info: any
      ) => {
        return await redisClient.checkCache(`${table}-${county}`, async () => {
          return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${county}`);
        });
      },
    },
    ...combinedQueries,
  },
});

export const schema = mergeSchemas({
  schemas: [
    new GraphQLSchema({
      query: RootQuery,
    }),
  ],
});

// if (!existsSync('dist')) {
//   mkdirSync('dist');
// }
// writeFileSync('dist/schema.graphql', printSchema(schema));
