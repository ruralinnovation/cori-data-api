import GeoJSON from "../../geojson";
import { GraphQLBoolean, GraphQLList, GraphQLString } from "graphql/type";

// TODO: Remove after testing call to local Python REST API
import { fetch } from "cross-fetch";

const county_summary = {
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

    const geoids = (counties !== null && counties.length > 0) ?
      counties.map(c => c.toString()).join(",") :
      "all";

    // return await counties.reduce(
    //   async (fc, geoid_co) => {
    return await (
      (async () => {

        console.log(`Query pythonApi: ${pythonApi.baseURL}bcat/county_summary${
          (geoids === "all") ? "" : "geoid_co=" + geoids
        }`);

        // TODO: Remove after testing call to local Python REST API
        fetch(`${pythonApi.baseURL}bcat/county_summary?geoid_co=${
          (geoids === "all") ? "" : "geoid_co=" + geoids
        }`)
          .catch((err) => console.log(err))
          .then((res) => console.log(res));

        //     const featureCollection = await fc;
        const res: any = (geoids === "all") ? await (async () => {
            const fc = (skipCache)
              ? await pythonApi.getItem(`bcat/county_summary`)
              : await redisClient.checkCache(`county_summary`, async () => {
                return await pythonApi.getItem(`bcat/county_summary`);
              });

            // console.log("FeatureCollection: ",
            //   (fc.hasOwnProperty("features")) ?
            //     (<Array<any>>fc.features)
            //       .map(f => ({
            //         ...f,
            //         "id": f.properties.geoid_co
            //       })) :
            //     fc.features
            // );

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
            ? await pythonApi.getItem(`bcat/county_summary?geoid_co=${geoids}`)
            : await redisClient.checkCache(`county_summary-${geoids}`, async () => {
              return await pythonApi.getItem(`bcat/county_summary?geoid_co=${geoids}`);
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
