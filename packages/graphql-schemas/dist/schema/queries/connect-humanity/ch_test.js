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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hfdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NjaGVtYS9xdWVyaWVzL2Nvbm5lY3QtaHVtYW5pdHkvY2hfdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlDQUErRTtBQUMvRSx5Q0FBeUM7QUFDekMseUNBQWtEO0FBRWxELE1BQU0sT0FBTyxHQUFHO0lBQ2QsNkRBQTZEO0lBQzdELElBQUksRUFBRSxtQkFBbUI7SUFDekIsd0RBQXdEO0lBQ3RELElBQUkseUJBQWlCLENBQUM7UUFDcEIsSUFBSSxFQUFFLGNBQWM7UUFDcEIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDYixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUNuQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUNuQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUNsQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUMvQixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsb0JBQVksRUFBRTtZQUMvQixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUNuQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUNuQyxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtZQUN0QyxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtTQUN2QyxDQUFDO0tBQ0gsQ0FBQztJQUNKLEtBQUs7SUFDTCxJQUFJLEVBQUUsSUFBSTtJQUNWLE9BQU8sRUFBRSxLQUFLLEVBQ1osQ0FBTSxFQUNOLEVBQU8sRUFDUCxFQUFFLFdBQVcsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFPLEVBQ25DLElBQVMsRUFDVCxFQUFFO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRyxPQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxDQUFDLENBQUM7UUFFckcsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXZGLE1BQU0sS0FBSyxHQUFHO1lBQ1osR0FBRyxNQUFNO1lBQ1QsVUFBVSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxrREFBa0Q7YUFDOUQ7WUFDRCxTQUFTLEVBQUUsQ0FBQywrQkFBK0IsQ0FBQztZQUM1QyxVQUFVLEVBQUUsT0FBTztZQUNuQixNQUFNLEVBQUUsYUFBYTtZQUNyQixPQUFPLEVBQUUsTUFBTTtZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLGFBQWEsRUFBRSxXQUFXO1lBQzFCLGFBQWEsRUFBRSxnRUFBZ0U7U0FDaEYsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFL0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDOzs7O0NBSXhDLEVBQ0ssRUFBRSxJQUFJLEVBQUUsc0JBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRS9CLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxFQUFFO2dCQUNsRCxHQUFHLEtBQUs7Z0JBQ1IsR0FBRyxDQUFDO2FBQ0wsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFFN0MsT0FBTztnQkFDTCxHQUFHLEtBQUs7Z0JBQ1IsR0FBRyxDQUFDO2dCQUNKLE9BQU8sRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDO2FBQzFCLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBTSw2REFBNkQ7U0FDbEUsQ0FBQyxDQUFDLENBQUMsQ0FBRSx3REFBd0Q7SUFDbEUsQ0FBQztDQUNGLENBQUM7QUFHRixrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHcmFwaFFMRmxvYXQsIEdyYXBoUUxPYmplY3RUeXBlLCBHcmFwaFFMU3RyaW5nIH0gZnJvbSBcImdyYXBocWwvaW5kZXhcIjtcbi8vIGltcG9ydCB7IEdyYXBoUUxMaXN0IH0gZnJvbSBcImdyYXBocWxcIjtcbmltcG9ydCB7IFF1ZXJ5VHlwZXMsIFNlcXVlbGl6ZSB9IGZyb20gXCJzZXF1ZWxpemVcIjtcblxuY29uc3QgY2hfdGVzdCA9IHtcbiAgLy8gQW4gYXJyYXkgKGxpc3QpIGZhaWxzIHRvIHRyYW5zZmVyIGd6aXBwZWQgYnkgbG9jYWwgc2FtIGNsaVxuICB0eXBlOiAvLyBuZXcgR3JhcGhRTExpc3QoXG4gIC8vIC4uLiBidXQgYSBzaW5nbGUgcmV0dXJuIG9iamVjdCBjYW4gYmUgZ3ppcHBlZCBsb2NhbGx5XG4gICAgbmV3IEdyYXBoUUxPYmplY3RUeXBlKHtcbiAgICAgIG5hbWU6ICdDSFRlc3RPYmplY3QnLFxuICAgICAgZmllbGRzOiAoKSA9PiAoe1xuICAgICAgICBcImdlb2lkX2NvXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcImdlb2lkX3RyXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcIm1lc3NhZ2VcIjogeyB0eXBlOiBHcmFwaFFMU3RyaW5nIH0sXG4gICAgICAgIFwibmFtZVwiOiB7IHR5cGU6IEdyYXBoUUxTdHJpbmcgfSxcbiAgICAgICAgXCJ2YWx1ZVwiOiB7IHR5cGU6IEdyYXBoUUxGbG9hdCB9LFxuICAgICAgICBcImNhdGVnb3J5XCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcInZhcmlhYmxlXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcImNhdGVnb3J5X3BsXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9LFxuICAgICAgfSlcbiAgICB9KSxcbiAgLy8gKSxcbiAgYXJnczogbnVsbCxcbiAgcmVzb2x2ZTogYXN5bmMgKFxuICAgIF86IGFueSxcbiAgICBfXzogYW55LFxuICAgIHsgZGF0YVNvdXJjZXM6IHsgcHl0aG9uQXBpIH0gfTogYW55LFxuICAgIGluZm86IGFueVxuICApID0+ICB7XG4gICAgY29uc29sZS5sb2coXCJDYW4gbm93IGFjY2VzcyBweXRob25BcGkuZ2V0REJDb25maWcuLi5cIiwgIHR5cGVvZiBweXRob25BcGkuZ2V0REJDb25maWcpO1xuICAgIGNvbnN0IGNvbmZpZyA9IHB5dGhvbkFwaS5nZXREQkNvbmZpZygncHJval9jb25uZWN0X2h1bWFuaXR5JylbcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgXCJkZXZlbG9wbWVudFwiXTtcblxuICAgIGNvbnN0IHNlcXVlbGl6ZSA9IG5ldyBTZXF1ZWxpemUoY29uZmlnLmRhdGFiYXNlLCBjb25maWcudXNlciwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcpO1xuXG4gICAgY29uc3QgdmFsdWUgPSB7XG4gICAgICAuLi5jb25maWcsXG4gICAgICBcImFjc190ZXN0XCI6IHtcbiAgICAgICAgXCJtZXNzYWdlXCI6IFwidmFsdWUgb2YgYSBhbiBcXFwiYWNzX3Rlc3RcXFwiIGVuY2Fwc3VsYXRlZCBwcm9wZXJ0eVwiXG4gICAgICB9LFxuICAgICAgXCJtZXNzYWdlXCI6IChcInZhbHVlIG9mIGEgdG9wIGxldmVsIHByb3BlcnR5XCIpLFxuICAgICAgXCJnZW9pZF9jb1wiOiBcIjMzMDA5XCIsXG4gICAgICBcIm5hbWVcIjogXCJwY3RfYmJfMjVfM1wiLFxuICAgICAgXCJ2YWx1ZVwiOiAwLjgzNjYsXG4gICAgICBcImNhdGVnb3J5XCI6IFwiYmJcIixcbiAgICAgIFwidmFyaWFibGVcIjogXCIyNV8zXCIsXG4gICAgICBcImNhdGVnb3J5X3BsXCI6IFwiQnJvYWRiYW5kXCIsXG4gICAgICBcImRlc2NyaXB0aW9uXCI6IFwiUGVyY2VudCBvZiBicm9hZGJhbmQgc2VydmljZWFibGUgbG9jYXRpb25zIHdpdGggYWNjZXNzIHRvIDI1LzNcIixcbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coXCJSZXNvbHZlIGNoX3RldHMgbm8gYXJnczogXFxuXCIsIF9fKTtcblxuICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IHNlcXVlbGl6ZS5xdWVyeShgXG5TRUxFQ1QgZ2VvaWQsIGdlb2lkX3RyLCBDT05DQVQoc3RhdGVmcCwgY291bnR5ZnApIGFzIGdlb2lkX2NvLCBwY3RfYmJfMjVfMywgc3Rfc2ltcGxpZnkoc3RfdHJhbnNmb3JtKGdlb20sIDQzMjYpLCAwLjApIGFzIGdlb21cbiAgICBGUk9NIHNjaF9jZW5zdXNfdGlnZXIuc291cmNlX3RpZ2VyXzIwMjBfdHJhY3RzLCBwcm9qX2NsaW1hdGUuY2hfYXBwX3dpZGVfdHJhY3RcbiAgICBXSEVSRSBzdGF0ZWZwID0gJzMzJyBBTkQgY291bnR5ZnAgPSAnMDA5JyBBTkQgZ2VvaWQgPSBnZW9pZF90cjtcbmAsXG4gICAgICB7IHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUIH0pO1xuXG4gICAgcmV0dXJuIHZhbHVlcy5tYXAodiA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImNoX3Rlc3QgcmVzb2x2ZXIgd2lsbCByZXR1cm4gdmFsdWU6IFwiLCB7XG4gICAgICAgIC4uLnZhbHVlLFxuICAgICAgICAuLi52XG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKFwicGN0X2JiXzI1XzNcIiwgdltcInBjdF9iYl8yNV8zXCJdKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4udmFsdWUsXG4gICAgICAgIC4uLnYsXG4gICAgICAgIFwidmFsdWVcIjogdltcInBjdF9iYl8yNV8zXCJdXG4gICAgICB9O1xuICAgIH0pICAgICAgLy8gQW4gYXJyYXkgKGxpc3QpIGZhaWxzIHRvIHRyYW5zZmVyIGd6aXBwZWQgYnkgbG9jYWwgc2FtIGNsaVxuICAgICAgWzBdOyAgLy8gLi4uIGJ1dCBhIHNpbmdsZSByZXR1cm4gb2JqZWN0IGNhbiBiZSBnemlwcGVkIGxvY2FsbHlcbiAgfVxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBjaF90ZXN0O1xuIl19