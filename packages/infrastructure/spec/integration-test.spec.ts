/**
 * Copyright VoiceFoundry Inc. 2022. All Rights Reserved.
 *
 * Integration tests for the API gateway.
 */
import { Auth } from "aws-amplify";
import axios, { AxiosInstance } from 'axios';
/* fail() has been removed from jest: https://github.com/jestjs/jest/issues/11698
 * ... but is available with testRunner: "jest-jasmine2" or the following import:
// import fail from "jest-jasmine2";
 * (from https://stackoverflow.com/a/73922010/1396477):
 */
import { getTestConfig } from './testUtils';
import { apolloIntegrationEndpoints, pythonIntegrationEndpoints } from './integrationConfigurations';

// // import config from '@cori-risi/frontend/amplifyconfiguration.json';
// try {
//   const amplifyconfiguration = require('../../frontend/amplifyconfiguration.json') || null;
//   Amplify.configure(amplifyconfiguration);
// } catch (e) {
//   console.log('../../frontend/amplifyconfiguration.json is not available');
//   Amplify.configure({
//     Auth: {
//       Cognito: {
//         userPoolClientId: "5eusi16g0o2q1g1rr5ehgudodm",
//         userPoolId: "us-east-1_QeA4600FA",
//         userPoolEndpoint: "authcori.auth.us-east-1.amazoncognito.com",
//         identityPoolId: "us-east-1:2194a76a-fa3d-4c33-999e-e3c4b2b049ee",
//         loginWith: { // Optional
//           oauth: {
//             domain: 'authcori.auth.us-east-1.amazoncognito.com',
//             scopes: ['email', 'openid', 'profile'],
//             redirectSignIn: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
//             redirectSignOut: ["http://localhost:3000/", "http://localhost:5173/", "http://localhost:5174/"],
//             responseType: 'code',
//           },
//           username: true,
//           email: true, // Optional
//           phone: false, // Optional
//
//         },
//         // signUpVerificationMethod: "",
//         // userAttributes: "",
//         // mfa: "",
//         // passwordFormat: "",
//       },
//       // region: config.region,
//       // oauth: {
//       //   scope: ['email', 'openid', 'profile'],
//       //   redirectSignIn: '',
//       //   redirectSignOut: '',
//       //   responseType: 'code',
//       //   mandatorySignIn: true,
//       // },
//     },
//   });
// }

const logger = console;

jest.setTimeout(30000);

describe('ApiIntegrationTests', () => {
  let apiClient: AxiosInstance;

  /**
   * Sign in test user and define Axios
   */
  beforeAll(async () => {
    const config = await getTestConfig();

    logger.info('User: ', config.username);
    logger.info('PW: ', config.password);

    // const amplify_config = Amplify.getConfig() || null;
    //
    // if (!!amplify_config && amplify_config.hasOwnProperty("Auth") && !!amplify_config.Auth) {
    //   console.log("Amplify.getConfig():", amplify_config);
    //   let region = "us-east-1";
    //   if (!!amplify_config.Auth.Cognito.userPoolId) {
    //     const get_region =  amplify_config.Auth.Cognito.userPoolId.match(/(^us-.*)_.*/);
    //     region = (get_region !== null) ?
    //       get_region[1] :
    //       region;
    //   }
    //   Auth.configure({
    //     Auth: {
    //       region,
    //       userPoolId: amplify_config.Auth.Cognito.userPoolId,
    //       userPoolWebClientId: amplify_config.Auth.Cognito.userPoolClientId,
    //       oauth: (!!amplify_config.Auth.Cognito.loginWith) ?
    //         {
    //           ...amplify_config.Auth.Cognito.loginWith.oauth,
    //           mandatorySignIn: true
    //         } :
    //         {
    //           scope: ['email', 'openid', 'profile'],
    //           redirectSignIn: '',
    //           redirectSignOut: '',
    //           responseType: 'code',
    //           mandatorySignIn: true
    //         },
    //     },
    //   });
    // } else {
      Auth.configure({
        Auth: {
          region: config.region,
          userPoolId: config.userPoolId,
          userPoolWebClientId: config.cognitoClientId,
          oauth: {
            scope: ['email', 'openid', 'profile'],
            redirectSignIn: '',
            redirectSignOut: '',
            responseType: 'code',
            mandatorySignIn: true,
          },
        },
      });
    // }

    const response = await Auth.signIn(config.username, config.password);
    const accessToken = response?.signInUserSession?.idToken?.jwtToken;
    if (!accessToken) {
      logger.info(`Response to Amplify/Cognito Auth request: ${JSON.stringify(response)}`);
      fail('Test user was not authenticated.');
    }
    // const accessToken = null;

    apiClient = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  });

  describe("Sanity check test suite configuration", () => {
    it("checks the config", () => {
      const SOME_CONSTANT = true;
      return expect(SOME_CONSTANT).toBeTruthy();
    });
  });

  describe('Python API Request 200 Status & Defined Response', () => {
    it('responds to RESTful request for a greeting', async () => {
      try {
        const response = await apiClient.get('/rest/hello');

        // Axios has an extra data wrapper
        const result = response.data;

        console.log(result);

        expect(response.status).toEqual(200);
        expect(result).toBeDefined();

      } catch (error) {
        logger.error(error);
        fail(error);
      }
    });
  });

  describe('Python API Request 200 Status & Defined Response', () => {
    it('responds to RESTful request for a BCAT county_summary for all US counties', async () => {
      try {
        const response = await apiClient.get('/rest/bcat/county_summary?limit=0');

        // Axios has an extra data wrapper
        const result = response.data;

        // console.log(result);

        expect(response.status).toEqual(200);
        expect(result).toBeDefined();

      } catch (error) {
        logger.error(error);
        fail(error);
      }
    });
  });

  describe('Python API Request 200 Status & Defined Response', () => {
    it('responds to RESTful request for all isp combo ID(s)', async () => {
      try {
        const response = await apiClient.get('/rest/bead/isp_combo');

        // Axios has an extra data wrapper
        const result = response.data;

        // console.log(result);

        expect(response.status).toEqual(200);
        expect(result).toBeDefined();

      } catch (error) {
        logger.error(error);
        fail(error);
      }
    });
  });

  describe('Python API Request 200 Status & Defined Response', () => {
    Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
      it(name, async () => {
        try {
          const response = await apiClient.get(val.geo);

          // Axios has an extra data wrapper
          const result = response.data;

          expect(result.type).toBeDefined();
          expect(result.type).toEqual('FeatureCollection');
          expect(result.features).toBeDefined();
          expect(Array.isArray(result.features)).toEqual(true);
          expect(result.features[0].type).toBeDefined();
          expect(result.features[0].type).toEqual('Feature');
          /* Features do not necessarily have geometry (see endpoints for bead) */
          // expect(result.features[0].geometry).toBeDefined();
          // expect(result.features[0].geometry.type).toBeDefined();
          // expect(result.features[0].geometry.coordinates).toBeDefined();
          // expect(Array.isArray(result.features[0].geometry.coordinates)).toEqual(true);

        } catch (error) {
          logger.error(error);
          fail(error);
        }
      });
    });
  });

  // describe('Python API Response MVT Tiles', () => {
  //   Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
  //     if (val.mvt) {
  //       it(name, async () => {
  //         try {
  //           const response = await apiClient.get(val.mvt);
  //
  //           expect(response.status).toEqual(200);
  //           expect(response.headers['content-type']).toEqual('application/x-protobuf');
  //         } catch (error) {
  //           logger.error(error);
  //           /* fail() has been removed from jest: https://github.com/jestjs/jest/issues/11698 */
  //           // fail(error);
  //         }
  //       });
  //     }
  //   });
  // });

  describe('Apollo GraphQL API Request Status 200 & Defined Response', () => {
    it('responds to GraphQL query for county_summary', async () => {
      try {
        const response = await apiClient.post('/graphql', {
          query: `query ($skipCache: Boolean) {
                  county_summary (skipCache: $skipCache) {
                      type
                      features {
                          type
                          id
                          properties
                      }
                  }
              }`,
          variables: `{
                      "skipCache": true
                  }`,
        });

        // Axios has an extra data wrapper
        const result = response.data?.data;

        // console.log(response.data);

        expect(response.status).toEqual(200);
        expect(result).toBeDefined();

        logger.info({
          type: result["county_summary"].type,
          features: result["county_summary"].features?.length,
        });

      } catch (error) {
        logger.error(error);
        fail(error);
      }
    });
  });

  describe('Apollo GraphQL API Request Status 200 & Defined Response', () => {
    Object.entries(apolloIntegrationEndpoints).forEach(([name, val]) => {
      it(name, async () => {
        try {
          const data_type = val.type;
          const response = await apiClient.post('/graphql', val.request);

          // Axios has an extra data wrapper
          const result = response.data?.data;

          // console.log(val.type);
          // console.log(response.data);

          expect(response.status).toEqual(200);
          expect(result).toBeDefined();

          logger.info({
            type: result[val.type].type,
            features: result[val.type].features?.length,
          });

        } catch (error) {
          logger.error(error);
          fail(error);
        }
      });
    });
  });
});
