import { GraphQLList } from "graphql/type";
declare const auction_904_authorized_geojson: {
    type: any;
    args: {
        geoid_co: {
            type: import("graphql/type").GraphQLScalarType<string, string>;
        };
        geoid_bl: {
            type: GraphQLList<import("graphql/type").GraphQLScalarType<string, string>>;
        };
        limit: {
            type: import("graphql/type").GraphQLScalarType<number, number>;
        };
        offset: {
            type: import("graphql/type").GraphQLScalarType<number, number>;
        };
        page: {
            type: import("graphql/type").GraphQLScalarType<number, number>;
        };
        skipCache: {
            type: import("graphql/type").GraphQLScalarType<boolean, boolean>;
        };
    };
    resolve: (_: any, { geoid_co, geoid_bl, limit, offset, page, skipCache }: {
        geoid_co: string;
        geoid_bl: string[];
        limit: number | undefined;
        offset: number | undefined;
        page: number | undefined;
        skipCache: boolean | undefined;
    }, { dataSources: { pythonApi }, redisClient }: any, info: any) => Promise<any>;
};
export default auction_904_authorized_geojson;
