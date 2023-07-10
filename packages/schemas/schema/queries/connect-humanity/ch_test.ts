import { GraphQLFloat, GraphQLNonNull, GraphQLObjectType, GraphQLScalarType, GraphQLString } from "graphql/index";
import { specifiedScalarTypes } from "graphql/type/scalars";
import { GraphQLInt } from "graphql/type";

const ch_test = {
  type: new GraphQLObjectType({
    name: 'CHTestObject',
    fields: () => ({
      "geoid_co": { type: GraphQLString },
      "message": { type: GraphQLString },
      "name": { type: GraphQLString },
      "value": { type: GraphQLFloat },
      "category": { type: GraphQLString },
      "variable": { type: GraphQLString },
      "category_pl": { type: GraphQLString },
      "description": { type: GraphQLString },
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

export default ch_test;
