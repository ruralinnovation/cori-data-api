import { GraphQLObjectType, GraphQLString } from "graphql/index";

const acs_test = {
  type: new GraphQLObjectType({
    name: 'TestObject',
    fields: () => ({
      message: { type: GraphQLString }
    })
  }),
  args: null,
  resolve: async (
    _: any,
    __: any,
    { dataSources: { pythonApi } }: any,
    info: any
  ) =>  await pythonApi.getItem(`acs/testing`)
};

export default acs_test;
