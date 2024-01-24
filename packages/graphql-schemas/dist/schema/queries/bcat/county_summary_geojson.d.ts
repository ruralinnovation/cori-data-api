declare const county_summary_geojson: {
    type: any;
    args: {
        geoid_co: {
            type: import("graphql/type").GraphQLScalarType<string, string>;
        };
        skipCache: {
            type: import("graphql/type").GraphQLScalarType<boolean, boolean>;
        };
    };
    resolve: (_: any, { geoid_co, skipCache }: {
        geoid_co: string;
        skipCache: boolean | undefined;
    }, { dataSources: { pythonApi }, redisClient }: any, info: any) => Promise<any>;
};
export default county_summary_geojson;
