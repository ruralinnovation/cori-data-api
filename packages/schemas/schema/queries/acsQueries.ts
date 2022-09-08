/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {GraphQLObjectType, GraphQLString } from 'graphql';
// import GeoJSON from '../geojson';

export const acsQueries: any = {
  acs_test: {
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
  }
};

export default acsQueries;
