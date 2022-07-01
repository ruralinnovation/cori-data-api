/**
 * Copyright VoiceFoundry Inc. 2022. All Rights Reserved.
 *
 * Integration tests for the API gateway.
 */
import { Auth } from 'aws-amplify';
import axios, { AxiosInstance } from 'axios';
import { getTestConfig } from './testUtils';

const logger = console;

describe('ApiIntegrationTests', () => {
  let apiClient: AxiosInstance;

  /**
   * Sign in test user and define Axios
   */
  beforeAll(async () => {
    const config = await getTestConfig();

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

  describe('Python API', () => {
    it('broadband_unserved_blocks', async () => {
      try {
        const response = await apiClient.get('/bcat/broadband_unserved_blocks/geojson?geoid_co=47001,47003');

        // Axios has an extra data wrapper
        const result = response.data;
        expect(result).toBeDefined();

        logger.info({ type: result.type, features: result.features?.length });
      } catch (error) {
        logger.error(error);
        fail(error);
      }
    });
  });

  describe('Apollo API', () => {
    it('broadband_unserved_blocks', async () => {
      try {
        const request = {
          query: `query ($counties: [String], $skipCache: Boolean) {
            broadband_unserved_blocks_geojson (counties: $counties, skipCache: $skipCache) {
                type
                features {
                    type
                    id
                    properties
                    geometry {
                        coordinates
                        type
                    }
                }
            }
          }`,
          variables: `{
              "counties": ["47167", "47017"],
              "skipCache": true
          }`,
        };

        const response = await apiClient.post('/graphql', request);

        // Axios has an extra data wrapper
        const result = response.data?.data?.broadband_unserved_blocks_geojson;
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
