import { GraphQLObjectType } from "graphql/index";
declare const acs_test: {
    type: GraphQLObjectType<any, any>;
    args: null;
    resolve: (_: any, __: any, { dataSources: { pythonApi } }: any, info: any) => Promise<any>;
};
export default acs_test;
