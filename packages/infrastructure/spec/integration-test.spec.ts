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
  let axiosClient: AxiosInstance;
  /**
   * Sign in test user and define Axios
   */
  beforeAll(async () => {
    const config = await getTestConfig();

    //create Auth amplify instance
    const options = {
      Analytics: {
        disabled: true
      },
      Auth: {
        region: config.region,
        userPoolId: config.userPoolId,
        userPoolWebClientId: config.cognitoClientId,
        oauth: {
          scope: ['email', 'openid', 'profile'],
          redirectSignIn: '',
          redirectSignOut: '',
          responseType: 'code',
          mandatorySignIn: true
        }
      }
    };
    Auth.configure(options);
    const response = await Auth.signIn(config.username, config.password);
    logger.info(`Response from amplify: ${JSON.stringify(response)}`);
    const accessToken = response?.signInUserSession?.idToken?.jwtToken;
    logger.info(`Access token: ${JSON.stringify(accessToken)}`);
    if (!accessToken) {
      fail('Test user was not authenticated.');
    }
    axiosClient = axios.create({
      baseURL: config.apiEndpoint,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    axiosClient.defaults.headers.common['Authorization'] = accessToken ? `Bearer ${accessToken}` : '';
  });

  it('Test geojson', async () => {
    try {
      const response = await axiosClient.get('/bcat/broadband_unserved_blocks/geojson?geoid_co=47001,47003');
      logger.info(`Test geojson: ${JSON.stringify(response.data)}`);
      expect(response.data).toBeDefined();
    } catch (error) {
      logger.error(error);
      fail(error);
    }
  });
});
