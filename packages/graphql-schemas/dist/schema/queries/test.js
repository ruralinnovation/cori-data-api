"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const graphql_1 = require("graphql");
const geojson_1 = require("../geojson");
exports.default = {
    test: {
        type: geojson_1.default.FeatureCollectionObject,
        args: {
            county: {
                type: graphql_1.GraphQLString,
            },
            skipCache: {
                type: graphql_1.GraphQLBoolean,
            },
        },
        resolve: async (_, { county, skipCache }, { dataSources: { pythonApi }, redisClient }, info) => {
            return skipCache
                ? await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`)
                : await redisClient.checkCache(`county_adjacency_crosswalk-${county}`, async () => {
                    return await pythonApi.getItem(`bcat/county_adjacency_crosswalk/geojson?geoid_co=${county}`);
                });
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NjaGVtYS9xdWVyaWVzL3Rlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2REFBNkQ7QUFDN0Qsc0RBQXNEO0FBQ3RELHVEQUF1RDtBQUN2RCxxQ0FBd0Y7QUFDeEYsd0NBQWlDO0FBRWpDLGtCQUFlO0lBQ2IsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLGlCQUFPLENBQUMsdUJBQXVCO1FBQ3JDLElBQUksRUFBRTtZQUNKLE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsdUJBQWM7YUFDckI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLHdCQUFjO2FBQ3JCO1NBQ0Y7UUFDRCxPQUFPLEVBQUUsS0FBSyxFQUNaLENBQU0sRUFDTixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQXdELEVBQzNFLEVBQUUsV0FBVyxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsV0FBVyxFQUFPLEVBQ2hELElBQVMsRUFDVCxFQUFFO1lBQ0YsT0FBTyxTQUFTO2dCQUNkLENBQUMsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsb0RBQW9ELE1BQU0sRUFBRSxDQUFDO2dCQUN2RixDQUFDLENBQUMsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLDhCQUE4QixNQUFNLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDOUUsT0FBTyxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsb0RBQW9ELE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQy9GLENBQUMsQ0FBQyxDQUFDO1FBQ1QsQ0FBQztLQUNGO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb24gKi9cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFycyAqL1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuaW1wb3J0IHsgR3JhcGhRTEJvb2xlYW4sIEdyYXBoUUxMaXN0LCBHcmFwaFFMU3RyaW5nLCBHcmFwaFFMT2JqZWN0VHlwZSB9IGZyb20gJ2dyYXBocWwnO1xuaW1wb3J0IEdlb0pTT04gZnJvbSAnLi4vZ2VvanNvbic7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdGVzdDoge1xuICAgIHR5cGU6IEdlb0pTT04uRmVhdHVyZUNvbGxlY3Rpb25PYmplY3QsXG4gICAgYXJnczoge1xuICAgICAgY291bnR5OiB7XG4gICAgICAgIHR5cGU6IEdyYXBoUUxTdHJpbmchLFxuICAgICAgfSxcbiAgICAgIHNraXBDYWNoZToge1xuICAgICAgICB0eXBlOiBHcmFwaFFMQm9vbGVhbixcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXNvbHZlOiBhc3luYyAoXG4gICAgICBfOiBhbnksXG4gICAgICB7IGNvdW50eSwgc2tpcENhY2hlIH06IHsgY291bnR5OiBzdHJpbmdbXTsgc2tpcENhY2hlOiBib29sZWFuIHwgdW5kZWZpbmVkIH0sXG4gICAgICB7IGRhdGFTb3VyY2VzOiB7IHB5dGhvbkFwaSB9LCByZWRpc0NsaWVudCB9OiBhbnksXG4gICAgICBpbmZvOiBhbnlcbiAgICApID0+IHtcbiAgICAgIHJldHVybiBza2lwQ2FjaGVcbiAgICAgICAgPyBhd2FpdCBweXRob25BcGkuZ2V0SXRlbShgYmNhdC9jb3VudHlfYWRqYWNlbmN5X2Nyb3Nzd2Fsay9nZW9qc29uP2dlb2lkX2NvPSR7Y291bnR5fWApXG4gICAgICAgIDogYXdhaXQgcmVkaXNDbGllbnQuY2hlY2tDYWNoZShgY291bnR5X2FkamFjZW5jeV9jcm9zc3dhbGstJHtjb3VudHl9YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHB5dGhvbkFwaS5nZXRJdGVtKGBiY2F0L2NvdW50eV9hZGphY2VuY3lfY3Jvc3N3YWxrL2dlb2pzb24/Z2VvaWRfY289JHtjb3VudHl9YCk7XG4gICAgICAgICAgfSk7XG4gICAgfSxcbiAgfSxcbn07XG4iXX0=