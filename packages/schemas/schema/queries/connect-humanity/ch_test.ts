import { GraphQLFloat, GraphQLObjectType, GraphQLString } from "graphql/index";
// import { GraphQLList } from "graphql";
import { QueryTypes, Sequelize } from "sequelize";

const ch_test = {
  // An array (list) fails to transfer gzipped by local sam cli
  type: // new GraphQLList(
  // ... but a single return object can be gzipped locally
    new GraphQLObjectType({
      name: 'CHTestObject',
      fields: () => ({
        "geoid_co": { type: GraphQLString },
        "geoid_tr": { type: GraphQLString },
        "message": { type: GraphQLString },
        "name": { type: GraphQLString },
        "value": { type: GraphQLFloat },
        "category": { type: GraphQLString },
        "variable": { type: GraphQLString },
        "category_pl": { type: GraphQLString },
        "description": { type: GraphQLString },
      })
    }),
  // ),
  args: null,
  resolve: async (
    _: any,
    __: any,
    { dataSources: { pythonApi } }: any,
    info: any
  ) =>  {
    console.log("Can now access pythonApi.getDBConfig...",  typeof pythonApi.getDBConfig);
    const config = pythonApi.getDBConfig('proj_connect_humanity')[process.env.NODE_ENV || "development"];

    const sequelize = new Sequelize(config.database, config.user, config.password, config);

    const value = {
      ...config,
      "acs_test": {
        "message": "value of a an \"acs_test\" encapsulated property"
      },
      "message": ("value of a top level property"),
      "geoid_co": "33009",
      "name": "pct_bb_25_3",
      "value": 0.8366,
      "category": "bb",
      "variable": "25_3",
      "category_pl": "Broadband",
      "description": "Percent of broadband serviceable locations with access to 25/3",
    };

    console.log("Resolve ch_tets no args: \n", __);

    const values = await sequelize.query(`
SELECT geoid, geoid_tr, CONCAT(statefp, countyfp) as geoid_co, pct_bb_25_3, st_simplify(st_transform(geom, 4326), 0.0) as geom
    FROM sch_census_tiger.source_tiger_2020_tracts, sch_proj_climate.ch_app_wide_tract
    WHERE statefp = '33' AND countyfp = '009' AND geoid = geoid_tr;
`,
      { type: QueryTypes.SELECT });

    return values.map(v => {
      console.log("ch_test resolver will return value: ", {
        ...value,
        ...v
      });
      console.log("pct_bb_25_3", v["pct_bb_25_3"]);

      return {
        ...value,
        ...v,
        "value": v["pct_bb_25_3"]
      };
    })      // An array (list) fails to transfer gzipped by local sam cli
      [0];  // ... but a single return object can be gzipped locally
  }
};

export default ch_test;
