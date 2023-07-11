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
  // ) =>  await pythonApi.getItem(`acs/testing`);
  ) =>  {
    console.log("Can now access pythonApi.getDBConfig...",  typeof pythonApi.getDBConfig);
    const config = pythonApi.getDBConfig('proj_connect_humanity')[process.env.NODE_ENV || "development"];

    const value = {
      ...config,
      "acs_test": {
        "message": "value of a an \"acs_test\" encapsulated property"
      },
      "message": ("value of a top level property")
    };

    console.log("acs_test resolver will return value: ", value);

    return value;
  }
};

export default acs_test;
