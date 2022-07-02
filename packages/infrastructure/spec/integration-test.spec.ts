/**
 * Copyright VoiceFoundry Inc. 2022. All Rights Reserved.
 *
 * Integration tests for the API gateway.
 */
import { Auth } from 'aws-amplify';
import axios, { AxiosInstance } from 'axios';
import { getTestConfig } from './testUtils';

const logger = console;

const pythonIntegrationEndpoints = {
  broadband_unserved_blocks: {
    url: '/bcat/broadband_unserved_blocks/geojson?geoid_co=47001,47003',
  },
  auction_904_subsidy_awards: {
    url: '/bcat/auction_904_subsidy_awards/geojson?geoid_co=47001,47003,47011',
  },
  county_broadband_farm_bill_eligibility: {
    url: '/bcat/county_broadband_farm_bill_eligibility/geojson?state_abbr=TN',
  },
  county_broadband_pending_rural_dev: {
    url: '/bcat/county_broadband_pending_rural_dev/geojson?state_abbr=TN',
  },
  county_ilecs_geo: {
    url: '/bcat/county_ilecs_geo/geojson?state_abbr=TN',
  },
  county_rural_dev_broadband_protected_borrowers: {
    url: '/bcat/county_rural_dev_broadband_protected_borrowers/geojson?stusps=TN',
  },
  county_summary: {
    url: '/bcat/county_summary/geojson?geoid_co=47001,47003',
  },
  fiber_cable_unserved_blocks: {
    url: '/bcat/fiber_cable_unserved_blocks/geojson?geoid_co=47001,47003',
  },
  incumbent_electric_providers_geo: {
    url: '/bcat/incumbent_electric_providers_geo/geojson?state_abbr=TN',
  },
  county_adjacency_crosswalk: {
    url: '/bcat/county_adjacency_crosswalk/geojson?geoid_co=47001,47003',
  },
};

const apolloIntegrationEndpoints = {
  broadband_unserved_blocks_geojson: {
    request: {
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
    },
  },
  auction_904_subsidy_awards_geojson: {
    request: {
      query: `query ($counties: [String]!, $skipCache: Boolean) {
                auction_904_subsidy_awards_geojson (counties: $counties, skipCache: $skipCache) {
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
    },
  },
};

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

  describe('Python API Request 200 Status & Defined Response', () => {
    Object.entries(pythonIntegrationEndpoints).forEach(([name, val]) => {
      it(name, async () => {
        try {
          const response = await apiClient.get(val.url);

          // Axios has an extra data wrapper
          const result = response.data;

          expect(response.status).toEqual(200);
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
          const response = await apiClient.get(val.url);

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
