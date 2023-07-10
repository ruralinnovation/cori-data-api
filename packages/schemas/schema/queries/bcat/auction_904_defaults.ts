import GeoJSON from "../../geojson";
import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLString } from "graphql/type";

const auction_904_defaults = {
  type: GeoJSON.FeatureCollectionObject,
  args: {
    geoid_co: {
      type: new GraphQLList(GraphQLString)!,
    },
    limit: {
      type: GraphQLInt
    },
    offset: {
      type: GraphQLInt
    },
    page: {
      type: GraphQLInt
    },
    skipCache: {
      type: GraphQLBoolean,
    },
  },
  resolve: async (
    _: any,
    { geoid_co, limit, offset, page, skipCache }: {
      geoid_co: string[];
      limit: number | undefined;
      offset: number | undefined;
      page: number | undefined;
      skipCache: boolean | undefined;
    },
    { dataSources: { pythonApi }, redisClient }: any,
    info: any
  ) => {

    const geoids = (typeof geoid_co !== 'undefined' && geoid_co !== null && geoid_co.length > 0) ?
      geoid_co.map(c => c.toString()).join(",") :
      "all";

    const page_size = (typeof limit !== 'undefined' && limit === limit) ?
      limit :
      0;

    const count_offset = (typeof offset !== 'undefined' && offset === offset) ?
      offset :
      0;

    const page_number = (typeof page !== 'undefined' && page === page) ?
      page :
      0;

    if (!!skipCache && typeof redisClient.disconnect === 'function') {
      // Disconnect from redis whenever skipCache == true
      console.log("Disconnect from redis whenever skipCache == true")
      redisClient.disconnect();
    }

    const rest_uri = `${pythonApi.baseURL}bcat/auction_904_defaults${
      (geoids === "all") ?
        `?limit=${page_size}&offset=${count_offset}&page=${page_number}` : 
        `?geoid_co=${geoids}&limit=${page_size}&offset=${count_offset}&page=${page_number}`
    }`;

    // return await geoid_co.reduce(
    //   async (fc, geoid_co) => {
    return await (
      (async () => {

        console.log("Query pythonApi: ", rest_uri);

        //     const featureCollection = await fc;
        const res: any = (geoids === "all") ? await (async () => {
            const fc = (skipCache)
              ? await pythonApi.getItem(`bcat/auction_904_defaults?limit=${page_size}&offset=${count_offset}&page=${page_number}`)
              : await redisClient.checkCache(`auction_904_defaults-`
                + `${page_size}-${count_offset}-${page_number}`, async () => {

                return await pythonApi.getItem(`bcat/auction_904_defaults?limit=${page_size}&offset=${count_offset}&page=${page_number}`);
              });

            return ({
              type: 'FeatureCollection',
              features: (fc.hasOwnProperty("features")) ?
                (<Array<any>>fc.features)
                  .map(f => ({
                    ...f,
                    "id": f.properties.geoid_co
                  })) :
                fc.features
            });
          })():
          (skipCache)
            ? await pythonApi.getItem(`bcat/auction_904_defaults`
              + `?geoid_co=${geoids}&limit=${page_size}&offset=${count_offset}&page=${page_number}`)
            : await redisClient.checkCache(`auction_904_defaults-`
              + `${geoids}-${page_size}-${count_offset}-${page_number}`, async () => {

              return await pythonApi.getItem(`bcat/auction_904_defaults`
                + `?geoid_co=${geoids}&limit=${page_size}&offset=${count_offset}&page=${page_number}`);
            });

        // console.log("res: ", await res);

        return ((res) ?
          await Promise.resolve(
            {
    //             ...featureCollection,
                "type": 'FeatureCollection',
                "features": res.features
            }
          ) :
    //       featureCollection
          await Promise.resolve(
            {
              "type": 'FeatureCollection',
              "features": []
            }
          )
        );
      })()
      //   },
      //   Promise.resolve({
      //     type: 'FeatureCollection',
      //     features: [],
      //   })
    );
  }
};

export default auction_904_defaults;
