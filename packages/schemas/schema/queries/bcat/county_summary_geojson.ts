import GeoJSON from "../../geojson";
import { GraphQLBoolean, GraphQLString } from "graphql/type";
import { fetch } from "cross-fetch";

const county_summary_geojson = {
  type: GeoJSON.FeatureCollectionObject,
  args: {
    geoid_co: {
      type: GraphQLString!,
    },
    skipCache: {
      type: GraphQLBoolean,
    },
  },
  resolve: async (
    _: any,
    { geoid_co, skipCache }: { geoid_co: string; skipCache: boolean | undefined },
    { dataSources: { pythonApi }, redisClient }: any,
    info: any
  ) => {

    if (!!skipCache && typeof redisClient.disconnect === 'function') {
      // Disconnect from redis whenever skipCache == true
      console.log("Disconnect from redis whenever skipCache == true")
      redisClient.disconnect();
    }

    return skipCache
      ? await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${geoid_co}`)
      : await redisClient.checkCache(`county_summary-${geoid_co}`, async () => {
        return await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${geoid_co}`);
      });
  },
};

export default county_summary_geojson;
