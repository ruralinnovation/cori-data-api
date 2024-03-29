"""
bcat configuration

    "resource name": {
        "table": real schema qualified table name,
        "tile_columns": comma separated columns to return for a vector tile request not including the geometry,
        "api_columns": columns to include for an api request including the geometry,
        "params": list of allowed filter params. "geom" for spatial queries,
        "geom": name of the geometry column,
        "epsg": epsg of the geometry column,
        "simplify": optional geometry simplification in 4326,
        "id": id column or None for ctid::bigint
    },

"""

CONFIG = {
    "global": {
        "params": [ "limit", "offset", "page" ],
        "epsg": 4269,
        "simplify": 0.00002,
        "precision": 6
    },
    "auction_904_authorized": {
        "table": "bcat.bcat_auction_904_authorized",
        "tile_columns": "geoid_bl, geoid_co, applicant, tier, latency, frn, sac, da_numbers, county, state, winning_bidder, winning_bid_total_in_state, number_of_locations_in_state",
        "api_columns": "geoid_bl, geoid_co, applicant, tier, latency, frn, sac, da_numbers, county, state, winning_bidder, winning_bid_total_in_state, number_of_locations_in_state, geom",
        "params": ["geoid_bl", "geoid_co", "applicant", "county", "state", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "simplify": 0.00002,
        "precision": 6,
        "id": "geoid_bl"
    },
    "auction_904_ready": {
        "table": "bcat.bcat_auction_904_ready_to_authorize",
        "tile_columns": "geoid_bl, geoid_co, applicant, frn, sac, county, state",
        "api_columns": "geoid_bl, geoid_co, applicant, frn, sac, county, state, geom",
        "params": ["geoid_bl", "geoid_co", "applicant", "county", "state", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "simplify": 0.00002,
        "precision": 6,
        "id": "geoid_bl"
    },
    "auction_904_defaults": {
        "table": "bcat.bcat_auction_904_defaults_denials",
        "tile_columns": "geoid_bl, geoid_co, applicant, da_numbers, county, state",
        "api_columns": "geoid_bl, geoid_co, applicant, da_numbers, county, state, geom",
        "params": ["geoid_bl", "geoid_co", "applicant", "county", "state", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "simplify": 0.00002,
        "precision": 6,
        "id": "geoid_bl"
    },
    "auction_904_subsidy_awards": {
        "table": "bcat.bcat_auction_904_subsidy_awards",
        "tile_columns": "geoid, name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        "api_columns": "geoid, state_abbr, name_co, subsidy_recipient, tier, geom, geoid_co, valid_raw",
        "params": ["geoid_co", "state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "simplify": 0.00002,
        "precision": 6,
        "id": "geoid"
    },
    "broadband_unserved_blocks": {
        "table": "bcat.bcat_broadband_unserved_blocks",
        "api_columns": "geoid_co, geom, state_abbr",
        "params": ["geoid_co", "state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_broadband_farm_bill_eligibility": {
        "table": "bcat.bcat_county_broadband_farm_bill_eligibility",
        "api_columns": "valid_raw, geom, state_abbr",
        "params": ["state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_broadband_pending_rural_dev": {
        "table": "bcat.bcat_county_broadband_pending_rural_dev",
        "api_columns": "state_abbr, applicant_name, geom, valid_raw, program, application_status",
        "params": ["state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_ilecs_geo": {
        "table": "bcat.bcat_county_ilecs_geo",
        "api_columns": "ilec_name, state_abbr, geom, ilec_hoco_name",
        "params": ["state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_rural_dev_broadband_protected_borrowers": {
        "table": "bcat.bcat_county_rural_dev_broadband_protected_borrowers",
        "api_columns": "geoid, land_sqmi, water_sqmi, geom, valid_raw, geoid_st, statens, affgeoid, state_abbr, lsad, region, division, mtfcc, funcstat, lat, lon",
        "params": ["geom", "state_abbr"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_summary": {
        "table": "bcat.bcat_county_summary",
        "api_columns": "geoid_co, name_co, broadband_100_20_pct_blocks_served, cable_pct_blocks_served, fiber_pct_blocks_served, fiber_providers, cable_providers, co_fiber_pct_blocks_served, pct_hh_no_fiber_cable, pct_hh_served_fiber_cable, pct_hh_served_cable, pct_hh_served_fiber, hh_no_fiber_cable, hh_served_fiber_cable, hh_served_cable, hh_served_fiber, total_households, lat, lon, state_name, geoid_st, state_abbr, geom",
        "params": ["geoid_co", "name_co", "geoid_st", "state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": "geoid_co"
    },
    "fiber_cable_unserved_blocks": {
        "table": "bcat.bcat_fiber_cable_unserved_blocks",
        "api_columns": "geoid_co, ur10, geom, state_abbr",
        "params": ["geoid_co", "state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "incumbent_electric_providers_geo": {
        "table": "bcat.bcat_incumbent_electric_providers_geo",
        "api_columns": "city, state_abbr, zip_code, utility_name, geom, states, utility_type, utility_holding_company",
        "params": ["state_abbr", "geom"],
        "geom": "geom",
        "epsg": 4269,
        "id": None
    },
    "county_adjacency_crosswalk": {
        "table": "bcat.county_adjacency_crosswalk",
        "api_columns": "name_co_neighbor, state_abbr, geoid_co_neighbor, state_abbr_neighbor, name_co, geoid_co",
        "params": ["geoid_co", "state_abbr"],
        "geom": None,
        "epsg": None,
        "id": None
    },
}
