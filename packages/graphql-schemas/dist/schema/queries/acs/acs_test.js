"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("graphql/index");
const acs_test = {
    type: new index_1.GraphQLObjectType({
        name: 'TestObject',
        fields: () => ({
            message: { type: index_1.GraphQLString }
        })
    }),
    args: null,
    resolve: async (_, __, { dataSources: { pythonApi } }, info) => await pythonApi.getItem(`acs/testing`)
};
exports.default = acs_test;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNzX3Rlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zY2hlbWEvcXVlcmllcy9hY3MvYWNzX3Rlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBaUU7QUFFakUsTUFBTSxRQUFRLEdBQUc7SUFDZixJQUFJLEVBQUUsSUFBSSx5QkFBaUIsQ0FBQztRQUMxQixJQUFJLEVBQUUsWUFBWTtRQUNsQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNiLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxxQkFBYSxFQUFFO1NBQ2pDLENBQUM7S0FDSCxDQUFDO0lBQ0YsSUFBSSxFQUFFLElBQUk7SUFDVixPQUFPLEVBQUUsS0FBSyxFQUNaLENBQU0sRUFDTixFQUFPLEVBQ1AsRUFBRSxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBTyxFQUNuQyxJQUFTLEVBQ1QsRUFBRSxDQUFFLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDN0MsQ0FBQztBQUVGLGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdyYXBoUUxPYmplY3RUeXBlLCBHcmFwaFFMU3RyaW5nIH0gZnJvbSBcImdyYXBocWwvaW5kZXhcIjtcblxuY29uc3QgYWNzX3Rlc3QgPSB7XG4gIHR5cGU6IG5ldyBHcmFwaFFMT2JqZWN0VHlwZSh7XG4gICAgbmFtZTogJ1Rlc3RPYmplY3QnLFxuICAgIGZpZWxkczogKCkgPT4gKHtcbiAgICAgIG1lc3NhZ2U6IHsgdHlwZTogR3JhcGhRTFN0cmluZyB9XG4gICAgfSlcbiAgfSksXG4gIGFyZ3M6IG51bGwsXG4gIHJlc29sdmU6IGFzeW5jIChcbiAgICBfOiBhbnksXG4gICAgX186IGFueSxcbiAgICB7IGRhdGFTb3VyY2VzOiB7IHB5dGhvbkFwaSB9IH06IGFueSxcbiAgICBpbmZvOiBhbnlcbiAgKSA9PiAgYXdhaXQgcHl0aG9uQXBpLmdldEl0ZW0oYGFjcy90ZXN0aW5nYClcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGFjc190ZXN0O1xuIl19