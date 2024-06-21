export const pythonIntegrationEndpoints = {
  "responds to RESTful request for auction_904_authorized": {
    geo: '/rest/bcat/auction_904_authorized/geojson?limit=11',
    // MVT is unavailable from CORI Data API // mvt: '/rest/bcat/auction_904_authorized/tiles/10/278/408.pbf',
    // TODO: Can we redirect request to Mapbox?
  },
  "responds to RESTful request for geojson of given block ID": {
    geo: '/rest/bead/geojson?geoid_bl=010010201001003'
  },
  "responds to RESTful request for blocks in given tract id": {
    geo: '/rest/ch/ch_bb_map/bl?geoid_tr=01003011601'
  }
};

export const apolloIntegrationEndpoints = {
    // "responds to GraphQL query for auction_904_authorized": {
    //     type: "auction_904_authorized",
    //     request: {
    //       query: `query ($geoid_co: [String]!, $limit: Int, $offset: Int, $skipCache: Boolean) {
    //                   auction_904_authorized (
    //                       geoid_co: $geoid_co,
    //                       limit: $limit,
    //                       offset: $offset,
    //                       skipCache: $skipCache) {
    //                       type
    //                       features {
    //                           type
    //                           id
    //                           properties
    //                       }
    //                   }
    //               }`,
    //       variables: `{
    //                       "geoid_co": [
    //                           "47167"
    //                       ],
    //                       "limit": 11,
    //                       "offset": 0,
    //                       "skipCache": true
    //                   }`,
    //     },
    // },
    // "responds to GraphQL query for county_summary": {
    //     type: "auction_904_authorized",
    //     request: {
    //       query: `query ($skipCache: Boolean) {
    //                 county_summary (skipCache: $skipCache) {
    //                     type
    //                     features {
    //                         type
    //                         id
    //                         properties
    //                     }
    //                 }
    //             }`,
    //       variables: `{
    //                 "skipCache": true
    //             }`,
    //     },
    // },
    "responds to GraphQL query for ERCS3TestObject": {
        type: "erc_test",
        request: {
          query: `query {
                    erc_test {
                        erc_s3_test
                        message
                    }
                }`,
          variables: `{}`,
        },
    },
};
