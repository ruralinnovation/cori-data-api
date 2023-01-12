"""
acs configuration

    'resource name': {
        'table': real schema qualified table name,
        'tile_columns': comma separated columns to return for a vector tile request not including the geometry,
        'api_columns': columns to include for an api request including the geometry,
        'params': list of allowed filter params. "geom" for spatial queries,
        'geom': name of the geometry column,
        'epsg': epsg of the geometry column,
        'simplify': optional geometry simplification in 4326,
        'id': id column or None for ctid::bigint
    },

"""

CONFIG = {
    'acs_test': {
        'table': 'acs.acs_5_yr_county',
        'tile_columns': "geoid_co, acs_code, variable, year, estimate, moe",
        'api_columns': "geoid_co, acs_code, variable, year, estimate, moe",
        "limit": 3500,
        'params': ['geoid_co', 'acs_code', 'variable', 'year'],
        'geom': None,
        'epsg': None,
        'id': None,
    },
    'acs_5_yr_county': {
        'table': 'acs.acs_5_yr_county',
        'tile_columns': "geoid_co, acs_code, variable, year, estimate, moe",
        'api_columns': "geoid_co, acs_code, variable, year, estimate, moe",
        "limit": 3500,
        'params': ['geoid_co', 'acs_code', 'variable', 'year'],
        'geom': None,
        'epsg': None,
        'id': None,
    },
}
