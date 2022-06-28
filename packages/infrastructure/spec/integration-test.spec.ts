/**
 * Copyright VoiceFoundry Inc. 2022. All Rights Reserved.
 *
 * Integration tests for the API gateway.
 */
import { Auth } from 'aws-amplify';
import axios, { AxiosInstance } from 'axios';
import { getConfig, getLocalGitBranch, IMixedConfig } from '../../../config';

const logger = console;

describe('ApiIntegrationTests', () => {
  let configData: IMixedConfig;

  let axiosClient: AxiosInstance;
  /**
   * Sign in test user and define Axios
   */
  beforeAll(async () => {
    //load the config for the environment
    const branch = await getLocalGitBranch();
    configData = getConfig(branch);

    if (!configData.testing) {
      fail('Testing props are not defined for this branch');
    }

    //create Auth amplify instance
    const options = {
      Analytics: {
        disabled: true
      },
      Auth: {
        region: configData.env.region,
        userPoolId: configData.userPoolId,
        userPoolWebClientId: configData.testing?.cognitoClientId,
        // identityPoolId: configData.identityPoolId,
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
    const response = await Auth.signIn(configData.testing.username, configData.testing.password);
    logger.info(`Response from amplify: ${JSON.stringify(response)}`);
    const accessToken = response?.signInUserSession?.idToken?.jwtToken;
    logger.info(`Access token: ${JSON.stringify(accessToken)}`);
    if (!accessToken) {
      fail('Test user was not authenticated.');
    }
    axiosClient = axios.create({
      baseURL: configData.testing?.apiEndpoint,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    axiosClient.defaults.headers.common['Authorization'] = accessToken ? `Bearer ${accessToken}` : '';
  });

  it('Test geojson', async () => {
    try {
      const response = await axiosClient.get('/bcat/auction_904_subsidy_awards/geojson/FL');
      logger.info(`Test geojson: ${JSON.stringify(response.data)}`);
      expect(response.data).toBeDefined();
    } catch (error) {
      logger.error(error);
      fail(error);
    }
  });
});
