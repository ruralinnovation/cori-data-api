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

  describe("Sanity check test suite configuration", () => {
    it("Checks config", async () => {
      const SOME_CONSTANT = true;
      expect(SOME_CONSTANT).toBeTruthy();
    });
  });

  /* This is now hitting the local api when GIT_BRANCH is _unset_ */

  describe('Python API Request 200 Status & Defined Response', () => {
    it('county_summary', async () => {
      try {
        const response = await apiClient.get('/bcat/county_summary?limit=0');

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
    it('bb_map', async () => {
      try {
        const response = await apiClient.get('/ch/bl/bb_map?geoid_tr=51029930201');

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

          console.log(val.geo);

          // Axios has an extra data wrapper
          const result = response.data;

          expect(response.status).toEqual(200);

          console.log("OK 200");

          expect(result).toBeDefined();
        } catch (error) {
          logger.error(error);
          fail(error);
        }
      });
    });
  });

  describe('Python API Response GeoJSON Format', () => {
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
          expect(result.features[0].geometry).toBeDefined();
          expect(result.features[0].geometry.type).toBeDefined();
          expect(result.features[0].geometry.coordinates).toBeDefined();
          expect(Array.isArray(result.features[0].geometry.coordinates)).toEqual(true);
        } catch (error) {
          logger.error(error);
          fail(error);
        }
      });
    });
  });

  describe('Python API Response MVT Tiles', () => {
    Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
      if (val.mvt) {
        it(name, async () => {
          try {
            const response = await apiClient.get(val.mvt);

            expect(response.status).toEqual(200);
            expect(response.headers['content-type']).toEqual('application/x-protobuf');
          } catch (error) {
            logger.error(error);
            fail(error);
          }
        });
      }
    });
  });

  describe('Apollo GraphQL API Request Status 200 and Defined Response', () => {
    it('county_summary', async () => {
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
        const result = response.data?.data?.['county_summary'];

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
