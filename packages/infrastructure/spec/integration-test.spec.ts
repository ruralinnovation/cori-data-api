/**
 * Copyright VoiceFoundry Inc. 2022. All Rights Reserved.
 *
 * Integration tests for the API gateway.
 */
import { Auth } from 'aws-amplify';
import axios, { AxiosInstance } from 'axios';
import { getTestConfig } from './testUtils';
import { apolloIntegrationEndpoints, pythonIntegrationEndpoints } from './integrationConfigurations';
jest.setTimeout(30000);

const logger = console;

describe('ApiIntegrationTests', () => {
  let apiClient: AxiosInstance;

  /**
   * Sign in test user and define Axios
   */
  beforeAll(async () => {
    const config = await getTestConfig();

    logger.info('User: ', config.username);
    logger.info('PW: ', config.password);
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

    const response = await Auth.signIn(config.username, config.password);
    const accessToken = response?.signInUserSession?.idToken?.jwtToken;
    if (!accessToken) {
      logger.info(`Response from amplify: ${JSON.stringify(response)}`);
      fail('Test user was not authenticated.');
    }

    apiClient = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  });

  // describe('Python API Request 200 Status & Defined Response', () => {
  //   it('Test', async () => {
  //     try {
  //       const response = await apiClient.get('/bcat/auction_904_subsidy_awards/geojson?geoid_co=47001,47003,47011');

  //       // Axios has an extra data wrapper
  //       const result = response.data;

  //       expect(response.status).toEqual(200);
  //       expect(result).toBeDefined();
  //     } catch (error) {
  //       logger.error(error);
  //       fail(error);
  //     }
  //   });
  // });
  // describe('Python API Request 200 Status & Defined Response', () => {
  //   Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
  //     it(name, async () => {
  //       try {
  //         const response = await apiClient.get(val.geo);

  //         // Axios has an extra data wrapper
  //         const result = response.data;

  //         expect(response.status).toEqual(200);
  //         expect(result).toBeDefined();
  //       } catch (error) {
  //         logger.error(error);
  //         fail(error);
  //       }
  //     });
  //   });
  // });

  // describe('Python API Response GeoJSON Format', () => {
  //   Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
  //     it(name, async () => {
  //       try {
  //         const response = await apiClient.get(val.geo);

  //         // Axios has an extra data wrapper
  //         const result = response.data;

  //         expect(result.type).toBeDefined();
  //         expect(result.type).toEqual('FeatureCollection');
  //         expect(result.features).toBeDefined();
  //         expect(Array.isArray(result.features)).toEqual(true);
  //         expect(result.features[0].type).toBeDefined();
  //         expect(result.features[0].type).toEqual('Feature');
  //         expect(result.features[0].geometry).toBeDefined();
  //         expect(result.features[0].geometry.type).toBeDefined();
  //         expect(result.features[0].geometry.coordinates).toBeDefined();
  //         expect(Array.isArray(result.features[0].geometry.coordinates)).toEqual(true);
  //       } catch (error) {
  //         logger.error(error);
  //         fail(error);
  //       }
  //     });
  //   });
  // });

  // describe('Python API Response MVT Tiles', () => {
  //   Object.entries(pythonIntegrationEndpoints).forEach(([name, val], i) => {
  //     if (val.mvt && i === 0) {
  //       it(name, async () => {
  //         try {
  //           const response = await apiClient.get(pythonIntegrationEndpoints.auction_904_subsidy_awards.mvt);

  //           expect(response.status).toEqual(200);
  //           expect(response.headers['content-type']).toEqual('application/x-protobuf');
  //         } catch (error) {
  //           logger.error(error);
  //           fail(error);
  //         }
  //       });
  //     }
  //   });
  // });

  describe('Apollo GraphQL API Request Status 200 and Defined Response', () => {
    Object.entries(apolloIntegrationEndpoints).forEach(([name, val]) => {
      it(name, async () => {
        try {
          const response = await apiClient.post('/graphql', val.request);

          // Axios has an extra data wrapper
          const result = response.data?.data?.[name];

          expect(response.status).toEqual(200);
          expect(result).toBeDefined();

          logger.info({
            type: result.type,
            features: result.features?.length,
          });
        } catch (error) {
          logger.error(error);
          fail(error);
        }
      });
    });
  });
});
