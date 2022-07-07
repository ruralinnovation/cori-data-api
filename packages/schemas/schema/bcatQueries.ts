/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { GraphQLBoolean, GraphQLList, GraphQLString } from 'graphql';
import GeoJSON from './geojson';

export const bcatQueries = {
  auction_904_subsidy_awards_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      counties: {
        type: new GraphQLList(GraphQLString)!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { counties, skipCache }: { counties: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return await counties.reduce(
        async (fc, county) => {
          const featureCollection = await fc;
          const res: any = skipCache
            ? await pythonApi.getItem(`bcat/auction_904_subsidy_awards/geojson?geoid_co=${county}`)
            : await redisClient.checkCache(`auction_904_subsidy_awards-${county}`, async () => {
                return await pythonApi.getItem(`bcat/auction_904_subsidy_awards/geojson?geoid_co=${county}`);
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
  auction_904_subsidy_awards_county_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      county: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { county, skipCache }: { county: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/auction_904_subsidy_awards/geojson?geoid_co=${county}`)
        : await redisClient.checkCache(`auction_904_subsidy_awards-${county}`, async () => {
            return await pythonApi.getItem(`bcat/auction_904_subsidy_awards/geojson?geoid_co=${county}`);
          });
    },
  },
  broadband_unserved_blocks_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      counties: {
        type: new GraphQLList(GraphQLString)!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { counties, skipCache }: { counties: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return await counties.reduce(
        async (fc, county) => {
          const featureCollection = await fc;
          const res: any = skipCache
            ? await pythonApi.getItem(`bcat/broadband_unserved_blocks/geojson?geoid_co=${county}`)
            : await redisClient.checkCache(`broadband_unserved_blocks-${county}`, async () => {
                return await pythonApi.getItem(`bcat/broadband_unserved_blocks/geojson?geoid_co=${county}`);
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
  broadband_unserved_blocks_county_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      county: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { county, skipCache }: { county: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/broadband_unserved_blocks/geojson?geoid_co=${county}`)
        : await redisClient.checkCache(`broadband_unserved_blocks-${county}`, async () => {
            return await pythonApi.getItem(`bcat/broadband_unserved_blocks/geojson?geoid_co=${county}`);
          });
    },
  },
  county_broadband_farm_bill_eligibility_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      state_abbr: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { state_abbr, skipCache }: { state_abbr: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_broadband_farm_bill_eligibility/geojson?state_abbr=${state_abbr}`)
        : await redisClient.checkCache(`county_broadband_farm_bill_eligibility-${state_abbr}`, async () => {
            return await pythonApi.getItem(
              `bcat/county_broadband_farm_bill_eligibility/geojson?state_abbr=${state_abbr}`
            );
          });
    },
  },
  county_broadband_pending_rural_dev_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      state_abbr: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { state_abbr, skipCache }: { state_abbr: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_broadband_pending_rural_dev/geojson?state_abbr=${state_abbr}`)
        : await redisClient.checkCache(`county_broadband_pending_rural_dev-${state_abbr}`, async () => {
            return await pythonApi.getItem(`bcat/county_broadband_pending_rural_dev/geojson?state_abbr=${state_abbr}`);
          });
    },
  },
  county_ilecs_geo_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      state_abbr: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { state_abbr, skipCache }: { state_abbr: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_ilecs_geo/geojson?state_abbr=${state_abbr}`)
        : await redisClient.checkCache(`county_ilecs_geo-${state_abbr}`, async () => {
            return await pythonApi.getItem(`bcat/county_ilecs_geo/geojson?state_abbr=${state_abbr}`);
          });
    },
  },
  county_rural_dev_broadband_protected_borrowers_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      state_abbr: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { state_abbr, skipCache }: { state_abbr: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_rural_dev_broadband_protected_borrowers/geojson?stusps=${state_abbr}`)
        : await redisClient.checkCache(`county_rural_dev_broadband_protected_borrowers-${state_abbr}`, async () => {
            return await pythonApi.getItem(
              `bcat/county_rural_dev_broadband_protected_borrowers/geojson?stusps=${state_abbr}`
            );
          });
    },
  },
  county_summary_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      counties: {
        type: new GraphQLList(GraphQLString)!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { counties, skipCache }: { counties: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return await counties.reduce(
        async (fc, county) => {
          const featureCollection = await fc;
          const res: any = skipCache
            ? await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${county}`)
            : await redisClient.checkCache(`county_summary-${county}`, async () => {
                return await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${county}`);
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
  county_summary_county_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      county: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { county, skipCache }: { county: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${county}`)
        : await redisClient.checkCache(`county_summary-${county}`, async () => {
            return await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${county}`);
          });
    },
  },
  fiber_cable_unserved_blocks_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      counties: {
        type: new GraphQLList(GraphQLString)!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { counties, skipCache }: { counties: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return await counties.reduce(
        async (fc, county) => {
          const featureCollection = await fc;
          const res: any = skipCache
            ? await pythonApi.getItem(`bcat/fiber_cable_unserved_blocks/geojson?geoid_co=${county}`)
            : await redisClient.checkCache(`fiber_cable_unserved_blocks-${county}`, async () => {
                return await pythonApi.getItem(`bcat/fiber_cable_unserved_blocks/geojson?geoid_co=${county}`);
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
  fiber_cable_unserved_blocks_county_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      county: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { county, skipCache }: { county: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/fiber_cable_unserved_blocks/geojson?geoid_co=${county}`)
        : await redisClient.checkCache(`fiber_cable_unserved_blocks-${county}`, async () => {
            return await pythonApi.getItem(`bcat/fiber_cable_unserved_blocks/geojson?geoid_co=${county}`);
          });
    },
  },
  incumbent_electric_providers_geo_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      state_abbr: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { state_abbr, skipCache }: { state_abbr: string; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/incumbent_electric_providers_geo/geojson?state_abbr=${state_abbr}`)
        : await redisClient.checkCache(`incumbent_electric_providers_geo-${state_abbr}`, async () => {
            return await pythonApi.getItem(`bcat/incumbent_electric_providers_geo/geojson?state_abbr=${state_abbr}`);
          });
    },
  },
  county_adjacency_crosswalk_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      counties: {
        type: new GraphQLList(GraphQLString)!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { counties, skipCache }: { counties: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return await counties.reduce(
        async (fc, county) => {
          const featureCollection = await fc;
          const res: any = skipCache
            ? await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`)
            : await redisClient.checkCache(`county_adjacency_crosswalk-${county}`, async () => {
                return await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`);
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
  county_adjacency_crosswalk_county_geojson: {
    type: GeoJSON.FeatureCollectionObject,
    args: {
      county: {
        type: GraphQLString!,
      },
      skipCache: {
        type: GraphQLBoolean,
      },
    },
    resolve: async (
      _: any,
      { county, skipCache }: { county: string[]; skipCache: boolean | undefined },
      { dataSources: { pythonApi }, redisClient }: any,
      info: any
    ) => {
      return skipCache
        ? await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`)
        : await redisClient.checkCache(`county_adjacency_crosswalk-${county}`, async () => {
            return await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`);
          });
    },
  },
};
