declare const _default: {
    test: {
        type: any;
        args: {
            county: {
                type: import("graphql").GraphQLScalarType<string, string>;
            };
            skipCache: {
                type: import("graphql").GraphQLScalarType<boolean, boolean>;
            };
        };
        resolve: (_: any, { county, skipCache }: {
            county: string[];
            skipCache: boolean | undefined;
        }, { dataSources: { pythonApi }, redisClient }: any, info: any) => Promise<any>;
    };
};
export default _default;
