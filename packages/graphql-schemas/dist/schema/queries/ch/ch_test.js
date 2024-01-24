"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("graphql/index");
// import { GraphQLList } from "graphql";
const sequelize_1 = require("sequelize");
const ch_test = {
    // An array (list) fails to transfer gzipped by local sam cli
    type: // new GraphQLList(
    // ... but a single return object can be gzipped locally
    new index_1.GraphQLObjectType({
        name: 'CHTestObject',
        fields: () => ({
            "geoid_co": { type: index_1.GraphQLString },
            "geoid_tr": { type: index_1.GraphQLString },
            "message": { type: index_1.GraphQLString },
            "name": { type: index_1.GraphQLString },
            "value": { type: index_1.GraphQLFloat },
            "category": { type: index_1.GraphQLString },
            "variable": { type: index_1.GraphQLString },
            "category_pl": { type: index_1.GraphQLString },
            "description": { type: index_1.GraphQLString },
        })
    }),
    // ),
    args: null,
    resolve: async (_, __, { dataSources: { pythonApi } }, info) => {
        console.log("Can now access pythonApi.getDBConfig...", typeof pythonApi.getDBConfig);
        const config = pythonApi.getDBConfig('proj_connect_humanity')[process.env.NODE_ENV || "development"];
        const sequelize = new sequelize_1.Sequelize(config.database, config.user, config.password, config);
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
    FROM sch_census_tiger.source_tiger_2020_tracts, proj_climate.ch_app_wide_tract
    WHERE statefp = '33' AND countyfp = '009' AND geoid = geoid_tr;
`, { type: sequelize_1.QueryTypes.SELECT });
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
        }) // An array (list) fails to transfer gzipped by local sam cli
        [0]; // ... but a single return object can be gzipped locally
    }
};
exports.default = ch_test;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hfdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NjaGVtYS9xdWVyaWVzL2NoL2NoX3Rlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBK0U7QUFDL0UseUNBQXlDO0FBQ3pDLHlDQUFrRDtBQUVsRCxNQUFNLE9BQU8sR0FBRztJQUNkLDZEQUE2RDtJQUM3RCxJQUFJLEVBQUUsbUJBQW1CO0lBQ3pCLHdEQUF3RDtJQUN0RCxJQUFJLHlCQUFpQixDQUFDO1FBQ3BCLElBQUksRUFBRSxjQUFjO1FBQ3BCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2IsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDbkMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDbkMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDbEMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDL0IsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLG9CQUFZLEVBQUU7WUFDL0IsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDbkMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDbkMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7WUFDdEMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFhLEVBQUU7U0FDdkMsQ0FBQztLQUNILENBQUM7SUFDSixLQUFLO0lBQ0wsSUFBSSxFQUFFLElBQUk7SUFDVixPQUFPLEVBQUUsS0FBSyxFQUNaLENBQU0sRUFDTixFQUFPLEVBQ1AsRUFBRSxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBTyxFQUNuQyxJQUFTLEVBQ1QsRUFBRTtRQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLEVBQUcsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEYsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLGFBQWEsQ0FBQyxDQUFDO1FBRXJHLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV2RixNQUFNLEtBQUssR0FBRztZQUNaLEdBQUcsTUFBTTtZQUNULFVBQVUsRUFBRTtnQkFDVixTQUFTLEVBQUUsa0RBQWtEO2FBQzlEO1lBQ0QsU0FBUyxFQUFFLENBQUMsK0JBQStCLENBQUM7WUFDNUMsVUFBVSxFQUFFLE9BQU87WUFDbkIsTUFBTSxFQUFFLGFBQWE7WUFDckIsT0FBTyxFQUFFLE1BQU07WUFDZixVQUFVLEVBQUUsSUFBSTtZQUNoQixVQUFVLEVBQUUsTUFBTTtZQUNsQixhQUFhLEVBQUUsV0FBVztZQUMxQixhQUFhLEVBQUUsZ0VBQWdFO1NBQ2hGLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLEtBQUssQ0FBQzs7OztDQUl4QyxFQUNLLEVBQUUsSUFBSSxFQUFFLHNCQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUUvQixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsRUFBRTtnQkFDbEQsR0FBRyxLQUFLO2dCQUNSLEdBQUcsQ0FBQzthQUNMLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBRTdDLE9BQU87Z0JBQ0wsR0FBRyxLQUFLO2dCQUNSLEdBQUcsQ0FBQztnQkFDSixPQUFPLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQzthQUMxQixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQU0sNkRBQTZEO1NBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUUsd0RBQXdEO0lBQ2xFLENBQUM7Q0FDRixDQUFDO0FBR0Ysa0JBQWUsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3JhcGhRTEZsb2F0LCBHcmFwaFFMT2JqZWN0VHlwZSwgR3JhcGhRTFN0cmluZyB9IGZyb20gXCJncmFwaHFsL2luZGV4XCI7XG4vLyBpbXBvcnQgeyBHcmFwaFFMTGlzdCB9IGZyb20gXCJncmFwaHFsXCI7XG5pbXBvcnQgeyBRdWVyeVR5cGVzLCBTZXF1ZWxpemUgfSBmcm9tIFwic2VxdWVsaXplXCI7XG5cbmNvbnN0IGNoX3Rlc3QgPSB7XG4gIC8vIEFuIGFycmF5IChsaXN0KSBmYWlscyB0byB0cmFuc2ZlciBnemlwcGVkIGJ5IGxvY2FsIHNhbSBjbGlcbiAgdHlwZTogLy8gbmV3IEdyYXBoUUxMaXN0KFxuICAvLyAuLi4gYnV0IGEgc2luZ2xlIHJldHVybiBvYmplY3QgY2FuIGJlIGd6aXBwZWQgbG9jYWxseVxuICAgIG5ldyBHcmFwaFFMT2JqZWN0VHlwZSh7XG4gICAgICBuYW1lOiAnQ0hUZXN0T2JqZWN0JyxcbiAgICAgIGZpZWxkczogKCkgPT4gKHtcbiAgICAgICAgXCJnZW9pZF9jb1wiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJnZW9pZF90clwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJtZXNzYWdlXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcIm5hbWVcIjogeyB0eXBlOiBHcmFwaFFMU3RyaW5nIH0sXG4gICAgICAgIFwidmFsdWVcIjogeyB0eXBlOiBHcmFwaFFMRmxvYXQgfSxcbiAgICAgICAgXCJjYXRlZ29yeVwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJ2YXJpYWJsZVwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJjYXRlZ29yeV9wbFwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgIH0pXG4gICAgfSksXG4gIC8vICksXG4gIGFyZ3M6IG51bGwsXG4gIHJlc29sdmU6IGFzeW5jIChcbiAgICBfOiBhbnksXG4gICAgX186IGFueSxcbiAgICB7IGRhdGFTb3VyY2VzOiB7IHB5dGhvbkFwaSB9IH06IGFueSxcbiAgICBpbmZvOiBhbnlcbiAgKSA9PiAge1xuICAgIGNvbnNvbGUubG9nKFwiQ2FuIG5vdyBhY2Nlc3MgcHl0aG9uQXBpLmdldERCQ29uZmlnLi4uXCIsICB0eXBlb2YgcHl0aG9uQXBpLmdldERCQ29uZmlnKTtcbiAgICBjb25zdCBjb25maWcgPSBweXRob25BcGkuZ2V0REJDb25maWcoJ3Byb2pfY29ubmVjdF9odW1hbml0eScpW3Byb2Nlc3MuZW52Lk5PREVfRU5WIHx8IFwiZGV2ZWxvcG1lbnRcIl07XG5cbiAgICBjb25zdCBzZXF1ZWxpemUgPSBuZXcgU2VxdWVsaXplKGNvbmZpZy5kYXRhYmFzZSwgY29uZmlnLnVzZXIsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnKTtcblxuICAgIGNvbnN0IHZhbHVlID0ge1xuICAgICAgLi4uY29uZmlnLFxuICAgICAgXCJhY3NfdGVzdFwiOiB7XG4gICAgICAgIFwibWVzc2FnZVwiOiBcInZhbHVlIG9mIGEgYW4gXFxcImFjc190ZXN0XFxcIiBlbmNhcHN1bGF0ZWQgcHJvcGVydHlcIlxuICAgICAgfSxcbiAgICAgIFwibWVzc2FnZVwiOiAoXCJ2YWx1ZSBvZiBhIHRvcCBsZXZlbCBwcm9wZXJ0eVwiKSxcbiAgICAgIFwiZ2VvaWRfY29cIjogXCIzMzAwOVwiLFxuICAgICAgXCJuYW1lXCI6IFwicGN0X2JiXzI1XzNcIixcbiAgICAgIFwidmFsdWVcIjogMC44MzY2LFxuICAgICAgXCJjYXRlZ29yeVwiOiBcImJiXCIsXG4gICAgICBcInZhcmlhYmxlXCI6IFwiMjVfM1wiLFxuICAgICAgXCJjYXRlZ29yeV9wbFwiOiBcIkJyb2FkYmFuZFwiLFxuICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlBlcmNlbnQgb2YgYnJvYWRiYW5kIHNlcnZpY2VhYmxlIGxvY2F0aW9ucyB3aXRoIGFjY2VzcyB0byAyNS8zXCIsXG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKFwiUmVzb2x2ZSBjaF90ZXRzIG5vIGFyZ3M6IFxcblwiLCBfXyk7XG5cbiAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBzZXF1ZWxpemUucXVlcnkoYFxuU0VMRUNUIGdlb2lkLCBnZW9pZF90ciwgQ09OQ0FUKHN0YXRlZnAsIGNvdW50eWZwKSBhcyBnZW9pZF9jbywgcGN0X2JiXzI1XzMsIHN0X3NpbXBsaWZ5KHN0X3RyYW5zZm9ybShnZW9tLCA0MzI2KSwgMC4wKSBhcyBnZW9tXG4gICAgRlJPTSBzY2hfY2Vuc3VzX3RpZ2VyLnNvdXJjZV90aWdlcl8yMDIwX3RyYWN0cywgcHJval9jbGltYXRlLmNoX2FwcF93aWRlX3RyYWN0XG4gICAgV0hFUkUgc3RhdGVmcCA9ICczMycgQU5EIGNvdW50eWZwID0gJzAwOScgQU5EIGdlb2lkID0gZ2VvaWRfdHI7XG5gLFxuICAgICAgeyB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVCB9KTtcblxuICAgIHJldHVybiB2YWx1ZXMubWFwKHYgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJjaF90ZXN0IHJlc29sdmVyIHdpbGwgcmV0dXJuIHZhbHVlOiBcIiwge1xuICAgICAgICAuLi52YWx1ZSxcbiAgICAgICAgLi4udlxuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhcInBjdF9iYl8yNV8zXCIsIHZbXCJwY3RfYmJfMjVfM1wiXSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnZhbHVlLFxuICAgICAgICAuLi52LFxuICAgICAgICBcInZhbHVlXCI6IHZbXCJwY3RfYmJfMjVfM1wiXVxuICAgICAgfTtcbiAgICB9KSAgICAgIC8vIEFuIGFycmF5IChsaXN0KSBmYWlscyB0byB0cmFuc2ZlciBnemlwcGVkIGJ5IGxvY2FsIHNhbSBjbGlcbiAgICAgIFswXTsgIC8vIC4uLiBidXQgYSBzaW5nbGUgcmV0dXJuIG9iamVjdCBjYW4gYmUgZ3ppcHBlZCBsb2NhbGx5XG4gIH1cbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgY2hfdGVzdDtcbiJdfQ==