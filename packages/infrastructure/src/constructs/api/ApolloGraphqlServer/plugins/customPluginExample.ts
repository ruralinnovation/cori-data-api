/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Custom Plugin Development
 * Tap into lifecycle hooks and add your custom code
 */

export const customServerPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  // eslint-disable-next-line require-await
  async requestDidStart(requestContext: any) {
    console.log('Request started! Query:\n' + requestContext.request.query);
    console.log('Request :\n' + JSON.stringify(requestContext.request));

    return {
      // Fires whenever Apollo Server will parse a GraphQL
      // request to create its associated document AST.
      // eslint-disable-next-line require-await
      async parsingDidStart(requestContext: any) {
        console.log('Parsing started!');
      },

      // Fires whenever Apollo Server will validate a
      // request's document AST against your GraphQL schema.
      // eslint-disable-next-line require-await
      async validationDidStart(requestContext: any) {
        console.log('Validation started!');
      },
    };
  },
};
