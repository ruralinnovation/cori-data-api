import GeoJSON from "../../geojson";
import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLString } from "graphql/type";

// TODO: Remove after testing call to local Python REST API
import { fetch } from "cross-fetch";

const county_summary = {
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
      10;

    const count_offset = (typeof offset !== 'undefined' && offset === offset) ?
      offset :
      0;

    const page_number = (typeof page !== 'undefined' && page === page) ?
      page :
      0;

    if (!!skipCache && typeof redisClient.disconnect === 'function') {
      // Disconnect from redis when ever skipCache == true
      console.log("Disconnect from redis when ever skipCache == true")
      redisClient.disconnect();
    }

    const rest_uri = `${pythonApi.baseURL}bcat/county_summary${
      (geoids === "all") ? 
        "?limit=0" : 
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
              ? await pythonApi.getItem(`bcat/county_summary?limit=0`)
              : await redisClient.checkCache(`county_summary-0`, async () => {


                // TODO: Remove after testing call to local Python REST API
                fetch(rest_uri)
                  .catch((err) => console.log("Test Python REST error: ", err))
                  .then((res) => {
                    console.log("Test Python REST response: ", res);
                    const tc = (<any>(<Response>res));
                    console.log("FeatureCollection: ",
                      (tc.hasOwnProperty("features")) ?
                        (<Array<any>>tc.features)
                          .map(f => ({
                            ...f,
                            "id": f.properties.geoid_co
                          })) :
                        tc.features
                    );
                  });

                return await pythonApi.getItem(`bcat/county_summary?limit=0`);
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
            ? await pythonApi.getItem(`bcat/county_summary`
              + `?geoid_co=${geoids}&limit=${page_size}&offset=${count_offset}&page=${page_number}`)
            : await redisClient.checkCache(`county_summary-`
              + `${geoids}-${page_size}-${count_offset}-${page_number}`, async () => {

              // TODO: Remove after testing call to local Python REST API
              fetch(rest_uri)
                .catch((err) => console.log("Test Python REST error: ", err))
                .then((res) => console.log("Test Python REST response: ", res));

              return await pythonApi.getItem(`bcat/county_summary`
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

export default county_summary;
