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
    const value = {
      "acs_test": {
        "message": "value of a an \"acs_test\" encapsulated property"
      },
      "geoid_co": "33009",
      "message": ("value of a top level property"),
      "name": "pct_bb_25_3",
      "value": 0.8366,
      "category": "bb",
      "variable": "25_3",
      "category_pl": "Broadband",
      "description": "Percent of broadband serviceable locations with access to 25/3",
    };

    // console.log("acs_test resolver will return value: ", value);

    return value;
  }
};

export default acs_test;
