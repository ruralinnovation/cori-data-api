"""
bcat configuration

    'resource name': {
        'table': real schema qualified table name,
        'tile_columns': comma separated columns to return for a vector tile request not including the geometry,
        'api_columns': columns to include for an api request including the geometry,
        'params': list of allowed filter params. "geom" for spatial queries,
        'geom': name of the geometry column,
        'epsg': epsg of the geometry column,
        'simplify': optional geometry simplification in 4326,
        'precision': optional geojson number of decimal digits of coordinate precision in 4326,
    },

    'auction_904_subsidy_awards': {
        'table': 'bcat.bcat_auction_904_subsidy_awards',
        'tile_columns': "name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        'api_columns': "geoms, name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4326,
        'simplify': 0.00002,
        'precision': 6,
    },


"""
import os


CONFIG = {
    'auction_904_subsidy_awards': {
        'table': 'bcat.bcat_auction_904_subsidy_awards',
        'tile_columns': "name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        'api_columns': "geoms, name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4326,
        'simplify': 0.00002,
        'precision': 6,
    },
    'broadband_unserved_blocks': {
        'table': 'bcat.bcat_broadband_unserved_blocks',
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_broadband_farm_bill_eligibility': {
        'table': 'bcat.bcat_county_broadband_farm_bill_eligibility',
        'params': ['state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_broadband_pending_rural_dev': {
        'table': 'bcat.bcat_county_broadband_pending_rural_dev',
        'params': ['state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_ilecs_geo': {
        'table': 'bcat.bcat_county_ilecs_geo',
        'params': ['state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_rural_dev_broadband_protected_borrowers': {
        'table': 'bcat.bcat_county_rural_dev_broadband_protected_borrowers',
        'params': ['geom', 'stusps'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_summary': {
        'table': 'bcat.bcat_county_summary',
        'params': ['geoid_co', 'state_abbr', 'geom'],
    },
    'fiber_cable_unserved_blocks': {
        'table': 'bcat.bcat_fiber_cable_unserved_blocks',
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'incumbent_electric_providers_geo': {
        'table': 'bcat.bcat_incumbent_electric_providers_geo',
        'params': ['state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_adjacency_crosswalk': {
        'table': 'bcat.county_adjacency_crosswalk',
        'params': ['geoid_co', 'state_abbr'],
    },
}


