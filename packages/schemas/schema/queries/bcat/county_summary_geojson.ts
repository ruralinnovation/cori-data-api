import GeoJSON from "../../geojson";
import { GraphQLBoolean, GraphQLString } from "graphql/type";

// TODO: Remove after testing call to local Python REST API
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
    // TODO: Remove after testing call to local Python REST API
    console.log(`Query pythonApi: ${pythonApi.baseURL}bcat/county_summary/geojson?geoid_co=${geoid_co}`);
    const test_req = fetch(`${pythonApi.baseURL}bcat/county_summary/geojson?geoid_co=${geoid_co}`);

    test_req
      .catch((err) => console.log("Test Python REST error: ",err))
      .then((res) => console.log("Test Python REST response: ",res));

    const check_res = await test_req;

    console.log(test_req);

    return skipCache
      ? await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${geoid_co}`)
      : await redisClient.checkCache(`county_summary-${geoid_co}`, async () => {
        return await pythonApi.getItem(`bcat/county_summary/geojson?geoid_co=${geoid_co}`);
      });
  },
};

export default county_summary_geojson;
