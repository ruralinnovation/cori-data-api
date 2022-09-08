export const pythonIntegrationEndpoints = {
  broadband_unserved_blocks: {
    geo: '/bcat/broadband_unserved_blocks/geojson?geoid_co=47001,47003',
    mvt: '/bcat/broadband_unserved_blocks/tiles/10/278/408.pbf',
  },
  auction_904_subsidy_awards: {
    geo: '/bcat/auction_904_subsidy_awards/geojson?geoid_co=47001,47003,47011',
    mvt: '/bcat/auction_904_subsidy_awards/tiles/10/278/408.pbf',
  },
  county_broadband_farm_bill_eligibility: {
    geo: '/bcat/county_broadband_farm_bill_eligibility/geojson?state_abbr=TN',
    mvt: '/bcat/county_broadband_farm_bill_eligibility/tiles/10/278/408.pbf',
  },
  county_broadband_pending_rural_dev: {
    geo: '/bcat/county_broadband_pending_rural_dev/geojson?state_abbr=TN',
    mvt: '/bcat/county_broadband_pending_rural_dev/tiles/10/278/408.pbf',
  },
  county_ilecs_geo: {
    geo: '/bcat/county_ilecs_geo/geojson?state_abbr=TN',
    mvt: '/bcat/county_ilecs_geo/tiles/10/278/408.pbf',
  },
  county_rural_dev_broadband_protected_borrowers: {
    geo: '/bcat/county_rural_dev_broadband_protected_borrowers/geojson?stusps=TN',
    mvt: '/bcat/county_rural_dev_broadband_protected_borrowers/tiles/10/278/408.pbf',
  },
  county_summary: {
    geo: '/bcat/county_summary/geojson?geoid_co=47001,47003',
    mvt: null,
  },
  fiber_cable_unserved_blocks: {
    geo: '/bcat/fiber_cable_unserved_blocks/geojson?geoid_co=47001,47003',
    mvt: '/bcat/fiber_cable_unserved_blocks/tiles/10/278/408.pbf',
  },
  incumbent_electric_providers_geo: {
    geo: '/bcat/incumbent_electric_providers_geo/geojson?state_abbr=TN',
    mvt: '/bcat/incumbent_electric_providers_geo/tiles/10/278/408.pbf',
  },
  county_adjacency_crosswalk: {
    geo: '/bcat/county_adjacency_crosswalk/geojson?geoid_co=47001,47003',
    mvt: null,
  },
};

export const apolloIntegrationEndpoints = {
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
