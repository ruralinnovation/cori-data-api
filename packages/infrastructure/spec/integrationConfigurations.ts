export const pythonIntegrationEndpoints = {
  auction_904_authorized: {
    geo: '/rest/bcat/auction_904_authorized/geojson?limit=11',
    mvt: '/rest/bcat/auction_904_authorized/tiles/10/278/408.pbf',
  }
};

export const apolloIntegrationEndpoints = {
  auction_904_authorized: {
    request: {
      query: `query ($geoid_co: [String]!, $limit: Int, $offset: Int, $skipCache: Boolean) {
                  auction_904_authorized (
                      geoid_co: $geoid_co,
                      limit: $limit,
                      offset: $offset,
                      skipCache: $skipCache) {
                      type
                      features {
                          type
                          id
                          properties
                      }
                  }
              }`,
      variables: `{
                      "geoid_co": [ 
                          "47167"
                      ],
                      "limit": 11,
                      "offset": 0,
                      "skipCache": true
                  }`,
    },
  },
};
