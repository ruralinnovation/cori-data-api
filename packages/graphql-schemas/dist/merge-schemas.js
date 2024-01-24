"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = void 0;
const schema_1 = require("@graphql-tools/schema");
const graphql_1 = require("graphql");
const geojson_1 = require("./schema/geojson");
const queries = require("./schema/queries");
const combinedQueries = Object.values(queries).reduce((obj, query) => {
    return {
        ...obj,
        ...query,
    };
}, {});
const RootQuery = new graphql_1.GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        setup: {
            type: geojson_1.default.GeometryTypeUnion,
            args: undefined,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
            resolve: (_, __, { dataSources }) => {
                return true;
            },
        },
        // feature_collection: {
        //   type: GeoJSON.FeatureCollectionObject,
        //   args: {
        //     table: {
        //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //       type: GraphQLString!,
        //     },
        //     counties: {
        //       type: new GraphQLList(GraphQLString),
        //     },
        //     state_abbr: {
        //       type: GraphQLString,
        //     },
        //     skipCache: {
        //       type: GraphQLBoolean,
        //     },
        //   },
        //   resolve: async (
        //     _: unknown,
        //     {
        //       table,
        //       state_abbr,
        //       counties,
        //       skipCache,
        //     }: {
        //       table: string;
        //       state_abbr: string;
        //       counties: string[];
        //       skipCache: boolean;
        //     },
        //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //     { dataSources, redisClient }: any,
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     info: unknown
        //   ) => {
        //     if (state_abbr) {
        //       return skipCache
        //         ? await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`)
        //         : await redisClient.checkCache(`${table}-${state_abbr}`, async () => {
        //             return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?state_abbr=${state_abbr}`);
        //           });
        //     } else {
        //       if (!counties) {
        //         throw new Error('When no state abbr is specified you MUSt filter by state_abbr');
        //       }
        //       return await counties.reduce(
        //         async (fc, geoid_co) => {
        //           const featureCollection = await fc;
        //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //           const res: any = skipCache
        //             ? await redisClient.checkCache(`${table}-${geoid_co}`, async () => {
        //                 return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${geoid_co}`);
        //               })
        //             : await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${geoid_co}`);
        //           if (res) {
        //             return {
        //               ...featureCollection,
        //               features: featureCollection.features.concat(res.features),
        //             };
        //           } else {
        //             return featureCollection;
        //           }
        //         },
        //         Promise.resolve({
        //           type: 'FeatureCollection',
        //           features: [],
        //         })
        //       );
        //     }
        //   },
        // },
        // county_feature: {
        //   type: GeoJSON.FeatureCollectionObject,
        //   args: {
        //     table: {
        //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //       type: GraphQLString!,
        //     },
        //     geoid_co: {
        //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //       type: GraphQLString!,
        //     },
        //   },
        //   resolve: async (
        //     _: unknown,
        //     { table, geoid_co }: { table: string; geoid_co: string },
        //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //     { dataSources, redisClient }: any,
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        //     info: any
        //   ) => {
        //     return await redisClient.checkCache(`${table}-${geoid_co}`, async () => {
        //       return await dataSources.pythonApi.getItem(`bcat/${table}/geojson?geoid_co=${geoid_co}`);
        //     });
        //   },
        // },
        ...combinedQueries,
    },
});
exports.schemas = (0, schema_1.mergeSchemas)({
    schemas: [
        new graphql_1.GraphQLSchema({
            query: RootQuery,
        }),
    ],
});
// if (!existsSync('dist')) {
//   mkdirSync('dist');
// }
// writeFileSync('dist/schema.graphql', printSchema(schema));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Utc2NoZW1hcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL21lcmdlLXNjaGVtYXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQXFEO0FBQ3JELHFDQUF1RztBQUN2Ryw4Q0FBdUM7QUFDdkMsNENBQTRDO0FBRTVDLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO0lBQ25FLE9BQU87UUFDTCxHQUFHLEdBQUc7UUFDTixHQUFHLEtBQUs7S0FDVCxDQUFDO0FBQ0osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBRVAsTUFBTSxTQUFTLEdBQUcsSUFBSSwyQkFBaUIsQ0FBQztJQUN0QyxJQUFJLEVBQUUsZUFBZTtJQUNyQixNQUFNLEVBQUU7UUFDTixLQUFLLEVBQUU7WUFDTCxJQUFJLEVBQUUsaUJBQU8sQ0FBQyxpQkFBaUI7WUFDL0IsSUFBSSxFQUFFLFNBQVM7WUFDZixpR0FBaUc7WUFDakcsT0FBTyxFQUFFLENBQUMsQ0FBVSxFQUFFLEVBQVcsRUFBRSxFQUFFLFdBQVcsRUFBTyxFQUFFLEVBQUU7Z0JBQ3pELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQztTQUNGO1FBQ0Qsd0JBQXdCO1FBQ3hCLDJDQUEyQztRQUMzQyxZQUFZO1FBQ1osZUFBZTtRQUNmLDZFQUE2RTtRQUM3RSw4QkFBOEI7UUFDOUIsU0FBUztRQUNULGtCQUFrQjtRQUNsQiw4Q0FBOEM7UUFDOUMsU0FBUztRQUNULG9CQUFvQjtRQUNwQiw2QkFBNkI7UUFDN0IsU0FBUztRQUNULG1CQUFtQjtRQUNuQiw4QkFBOEI7UUFDOUIsU0FBUztRQUNULE9BQU87UUFDUCxxQkFBcUI7UUFDckIsa0JBQWtCO1FBQ2xCLFFBQVE7UUFDUixlQUFlO1FBQ2Ysb0JBQW9CO1FBQ3BCLGtCQUFrQjtRQUNsQixtQkFBbUI7UUFDbkIsV0FBVztRQUNYLHVCQUF1QjtRQUN2Qiw0QkFBNEI7UUFDNUIsNEJBQTRCO1FBQzVCLDRCQUE0QjtRQUM1QixTQUFTO1FBQ1QscUVBQXFFO1FBQ3JFLHlDQUF5QztRQUN6QyxvRUFBb0U7UUFDcEUsb0JBQW9CO1FBQ3BCLFdBQVc7UUFDWCx3QkFBd0I7UUFDeEIseUJBQXlCO1FBQ3pCLGtHQUFrRztRQUNsRyxpRkFBaUY7UUFDakYsNEdBQTRHO1FBQzVHLGdCQUFnQjtRQUNoQixlQUFlO1FBQ2YseUJBQXlCO1FBQ3pCLDRGQUE0RjtRQUM1RixVQUFVO1FBQ1Ysc0NBQXNDO1FBQ3RDLG9DQUFvQztRQUNwQyxnREFBZ0Q7UUFDaEQsMkVBQTJFO1FBQzNFLHVDQUF1QztRQUN2QyxtRkFBbUY7UUFDbkYsNEdBQTRHO1FBQzVHLG1CQUFtQjtRQUNuQixtR0FBbUc7UUFDbkcsdUJBQXVCO1FBQ3ZCLHVCQUF1QjtRQUN2QixzQ0FBc0M7UUFDdEMsMkVBQTJFO1FBQzNFLGlCQUFpQjtRQUNqQixxQkFBcUI7UUFDckIsd0NBQXdDO1FBQ3hDLGNBQWM7UUFDZCxhQUFhO1FBQ2IsNEJBQTRCO1FBQzVCLHVDQUF1QztRQUN2QywwQkFBMEI7UUFDMUIsYUFBYTtRQUNiLFdBQVc7UUFDWCxRQUFRO1FBQ1IsT0FBTztRQUNQLEtBQUs7UUFDTCxvQkFBb0I7UUFDcEIsMkNBQTJDO1FBQzNDLFlBQVk7UUFDWixlQUFlO1FBQ2YsNkVBQTZFO1FBQzdFLDhCQUE4QjtRQUM5QixTQUFTO1FBQ1Qsa0JBQWtCO1FBQ2xCLDZFQUE2RTtRQUM3RSw4QkFBOEI7UUFDOUIsU0FBUztRQUNULE9BQU87UUFDUCxxQkFBcUI7UUFDckIsa0JBQWtCO1FBQ2xCLGdFQUFnRTtRQUNoRSxxRUFBcUU7UUFDckUseUNBQXlDO1FBQ3pDLHdHQUF3RztRQUN4RyxnQkFBZ0I7UUFDaEIsV0FBVztRQUNYLGdGQUFnRjtRQUNoRixrR0FBa0c7UUFDbEcsVUFBVTtRQUNWLE9BQU87UUFDUCxLQUFLO1FBQ0wsR0FBRyxlQUFlO0tBQ25CO0NBQ0YsQ0FBQyxDQUFDO0FBRVUsUUFBQSxPQUFPLEdBQUcsSUFBQSxxQkFBWSxFQUFDO0lBQ2xDLE9BQU8sRUFBRTtRQUNQLElBQUksdUJBQWEsQ0FBQztZQUNoQixLQUFLLEVBQUUsU0FBUztTQUNqQixDQUFDO0tBQ0g7Q0FDRixDQUFDLENBQUM7QUFFSCw2QkFBNkI7QUFDN0IsdUJBQXVCO0FBQ3ZCLElBQUk7QUFDSiw2REFBNkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtZXJnZVNjaGVtYXMgfSBmcm9tICdAZ3JhcGhxbC10b29scy9zY2hlbWEnO1xuaW1wb3J0IHsgR3JhcGhRTEJvb2xlYW4sIEdyYXBoUUxMaXN0LCBHcmFwaFFMT2JqZWN0VHlwZSwgR3JhcGhRTFNjaGVtYSwgR3JhcGhRTFN0cmluZyB9IGZyb20gJ2dyYXBocWwnO1xuaW1wb3J0IEdlb0pTT04gZnJvbSAnLi9zY2hlbWEvZ2VvanNvbic7XG5pbXBvcnQgKiBhcyBxdWVyaWVzIGZyb20gJy4vc2NoZW1hL3F1ZXJpZXMnO1xuXG5jb25zdCBjb21iaW5lZFF1ZXJpZXMgPSBPYmplY3QudmFsdWVzKHF1ZXJpZXMpLnJlZHVjZSgob2JqLCBxdWVyeSkgPT4ge1xuICByZXR1cm4ge1xuICAgIC4uLm9iaixcbiAgICAuLi5xdWVyeSxcbiAgfTtcbn0sIHt9KTtcblxuY29uc3QgUm9vdFF1ZXJ5ID0gbmV3IEdyYXBoUUxPYmplY3RUeXBlKHtcbiAgbmFtZTogJ1Jvb3RRdWVyeVR5cGUnLFxuICBmaWVsZHM6IHtcbiAgICBzZXR1cDoge1xuICAgICAgdHlwZTogR2VvSlNPTi5HZW9tZXRyeVR5cGVVbmlvbixcbiAgICAgIGFyZ3M6IHVuZGVmaW5lZCxcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnMsIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHJlc29sdmU6IChfOiB1bmtub3duLCBfXzogdW5rbm93biwgeyBkYXRhU291cmNlcyB9OiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gZmVhdHVyZV9jb2xsZWN0aW9uOiB7XG4gICAgLy8gICB0eXBlOiBHZW9KU09OLkZlYXR1cmVDb2xsZWN0aW9uT2JqZWN0LFxuICAgIC8vICAgYXJnczoge1xuICAgIC8vICAgICB0YWJsZToge1xuICAgIC8vICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgLy8gICAgICAgdHlwZTogR3JhcGhRTFN0cmluZyEsXG4gICAgLy8gICAgIH0sXG4gICAgLy8gICAgIGNvdW50aWVzOiB7XG4gICAgLy8gICAgICAgdHlwZTogbmV3IEdyYXBoUUxMaXN0KEdyYXBoUUxTdHJpbmcpLFxuICAgIC8vICAgICB9LFxuICAgIC8vICAgICBzdGF0ZV9hYmJyOiB7XG4gICAgLy8gICAgICAgdHlwZTogR3JhcGhRTFN0cmluZyxcbiAgICAvLyAgICAgfSxcbiAgICAvLyAgICAgc2tpcENhY2hlOiB7XG4gICAgLy8gICAgICAgdHlwZTogR3JhcGhRTEJvb2xlYW4sXG4gICAgLy8gICAgIH0sXG4gICAgLy8gICB9LFxuICAgIC8vICAgcmVzb2x2ZTogYXN5bmMgKFxuICAgIC8vICAgICBfOiB1bmtub3duLFxuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgdGFibGUsXG4gICAgLy8gICAgICAgc3RhdGVfYWJicixcbiAgICAvLyAgICAgICBjb3VudGllcyxcbiAgICAvLyAgICAgICBza2lwQ2FjaGUsXG4gICAgLy8gICAgIH06IHtcbiAgICAvLyAgICAgICB0YWJsZTogc3RyaW5nO1xuICAgIC8vICAgICAgIHN0YXRlX2FiYnI6IHN0cmluZztcbiAgICAvLyAgICAgICBjb3VudGllczogc3RyaW5nW107XG4gICAgLy8gICAgICAgc2tpcENhY2hlOiBib29sZWFuO1xuICAgIC8vICAgICB9LFxuICAgIC8vICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIC8vICAgICB7IGRhdGFTb3VyY2VzLCByZWRpc0NsaWVudCB9OiBhbnksXG4gICAgLy8gICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICAvLyAgICAgaW5mbzogdW5rbm93blxuICAgIC8vICAgKSA9PiB7XG4gICAgLy8gICAgIGlmIChzdGF0ZV9hYmJyKSB7XG4gICAgLy8gICAgICAgcmV0dXJuIHNraXBDYWNoZVxuICAgIC8vICAgICAgICAgPyBhd2FpdCBkYXRhU291cmNlcy5weXRob25BcGkuZ2V0SXRlbShgYmNhdC8ke3RhYmxlfS9nZW9qc29uP3N0YXRlX2FiYnI9JHtzdGF0ZV9hYmJyfWApXG4gICAgLy8gICAgICAgICA6IGF3YWl0IHJlZGlzQ2xpZW50LmNoZWNrQ2FjaGUoYCR7dGFibGV9LSR7c3RhdGVfYWJicn1gLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGRhdGFTb3VyY2VzLnB5dGhvbkFwaS5nZXRJdGVtKGBiY2F0LyR7dGFibGV9L2dlb2pzb24/c3RhdGVfYWJicj0ke3N0YXRlX2FiYnJ9YCk7XG4gICAgLy8gICAgICAgICAgIH0pO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgIGlmICghY291bnRpZXMpIHtcbiAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2hlbiBubyBzdGF0ZSBhYmJyIGlzIHNwZWNpZmllZCB5b3UgTVVTdCBmaWx0ZXIgYnkgc3RhdGVfYWJicicpO1xuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgICByZXR1cm4gYXdhaXQgY291bnRpZXMucmVkdWNlKFxuICAgIC8vICAgICAgICAgYXN5bmMgKGZjLCBnZW9pZF9jbykgPT4ge1xuICAgIC8vICAgICAgICAgICBjb25zdCBmZWF0dXJlQ29sbGVjdGlvbiA9IGF3YWl0IGZjO1xuICAgIC8vICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIC8vICAgICAgICAgICBjb25zdCByZXM6IGFueSA9IHNraXBDYWNoZVxuICAgIC8vICAgICAgICAgICAgID8gYXdhaXQgcmVkaXNDbGllbnQuY2hlY2tDYWNoZShgJHt0YWJsZX0tJHtnZW9pZF9jb31gLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBkYXRhU291cmNlcy5weXRob25BcGkuZ2V0SXRlbShgYmNhdC8ke3RhYmxlfS9nZW9qc29uP2dlb2lkX2NvPSR7Z2VvaWRfY299YCk7XG4gICAgLy8gICAgICAgICAgICAgICB9KVxuICAgIC8vICAgICAgICAgICAgIDogYXdhaXQgZGF0YVNvdXJjZXMucHl0aG9uQXBpLmdldEl0ZW0oYGJjYXQvJHt0YWJsZX0vZ2VvanNvbj9nZW9pZF9jbz0ke2dlb2lkX2NvfWApO1xuICAgIC8vICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAvLyAgICAgICAgICAgICAgIC4uLmZlYXR1cmVDb2xsZWN0aW9uLFxuICAgIC8vICAgICAgICAgICAgICAgZmVhdHVyZXM6IGZlYXR1cmVDb2xsZWN0aW9uLmZlYXR1cmVzLmNvbmNhdChyZXMuZmVhdHVyZXMpLFxuICAgIC8vICAgICAgICAgICAgIH07XG4gICAgLy8gICAgICAgICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmVDb2xsZWN0aW9uO1xuICAgIC8vICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAvLyAgICAgICAgICAgdHlwZTogJ0ZlYXR1cmVDb2xsZWN0aW9uJyxcbiAgICAvLyAgICAgICAgICAgZmVhdHVyZXM6IFtdLFxuICAgIC8vICAgICAgICAgfSlcbiAgICAvLyAgICAgICApO1xuICAgIC8vICAgICB9XG4gICAgLy8gICB9LFxuICAgIC8vIH0sXG4gICAgLy8gY291bnR5X2ZlYXR1cmU6IHtcbiAgICAvLyAgIHR5cGU6IEdlb0pTT04uRmVhdHVyZUNvbGxlY3Rpb25PYmplY3QsXG4gICAgLy8gICBhcmdzOiB7XG4gICAgLy8gICAgIHRhYmxlOiB7XG4gICAgLy8gICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAvLyAgICAgICB0eXBlOiBHcmFwaFFMU3RyaW5nISxcbiAgICAvLyAgICAgfSxcbiAgICAvLyAgICAgZ2VvaWRfY286IHtcbiAgICAvLyAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgIC8vICAgICAgIHR5cGU6IEdyYXBoUUxTdHJpbmchLFxuICAgIC8vICAgICB9LFxuICAgIC8vICAgfSxcbiAgICAvLyAgIHJlc29sdmU6IGFzeW5jIChcbiAgICAvLyAgICAgXzogdW5rbm93bixcbiAgICAvLyAgICAgeyB0YWJsZSwgZ2VvaWRfY28gfTogeyB0YWJsZTogc3RyaW5nOyBnZW9pZF9jbzogc3RyaW5nIH0sXG4gICAgLy8gICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgLy8gICAgIHsgZGF0YVNvdXJjZXMsIHJlZGlzQ2xpZW50IH06IGFueSxcbiAgICAvLyAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFycywgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIC8vICAgICBpbmZvOiBhbnlcbiAgICAvLyAgICkgPT4ge1xuICAgIC8vICAgICByZXR1cm4gYXdhaXQgcmVkaXNDbGllbnQuY2hlY2tDYWNoZShgJHt0YWJsZX0tJHtnZW9pZF9jb31gLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gICAgICAgcmV0dXJuIGF3YWl0IGRhdGFTb3VyY2VzLnB5dGhvbkFwaS5nZXRJdGVtKGBiY2F0LyR7dGFibGV9L2dlb2pzb24/Z2VvaWRfY289JHtnZW9pZF9jb31gKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICB9LFxuICAgIC8vIH0sXG4gICAgLi4uY29tYmluZWRRdWVyaWVzLFxuICB9LFxufSk7XG5cbmV4cG9ydCBjb25zdCBzY2hlbWFzID0gbWVyZ2VTY2hlbWFzKHtcbiAgc2NoZW1hczogW1xuICAgIG5ldyBHcmFwaFFMU2NoZW1hKHtcbiAgICAgIHF1ZXJ5OiBSb290UXVlcnksXG4gICAgfSksXG4gIF0sXG59KTtcblxuLy8gaWYgKCFleGlzdHNTeW5jKCdkaXN0JykpIHtcbi8vICAgbWtkaXJTeW5jKCdkaXN0Jyk7XG4vLyB9XG4vLyB3cml0ZUZpbGVTeW5jKCdkaXN0L3NjaGVtYS5ncmFwaHFsJywgcHJpbnRTY2hlbWEoc2NoZW1hKSk7XG4iXX0=