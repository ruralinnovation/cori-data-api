"""
ch configuration

    "resource name": {
        "table": real schema qualified table name,
        "tile_columns": comma separated columns to return for a vector tile request not including the geometry,
        "api_columns": columns to include for an api request including the geometry,
        "params": list of allowed filter params. "geom" for spatial queries,
        "geoid": geoid type ("geoid_co" | "geoid_tr" | "geoid_bl"),
        "geom": name of the geometry column,
        "epsg": epsg of the geometry column,
        "simplify": optional geometry simplification in 4326,
        "id": id column or None for ctid::bigint
    },

"""

CONFIG = {
    "ch_app_var_xwalk_county": {
        "table": "sch_proj_climate.ch_app_var_xwalk_county",
        "api_columns": "geoid_co, variable",
        "params": ["geoid_co", "variable" ],
        "geoid": "geoid_co",
        "geom": None,
        "epsg": None,
        "id": None,
    },
    "ch_app_var_xwalk_tract": {
        "table": "sch_proj_climate.ch_app_var_xwalk_tract",
        "api_columns": "geoid_tr, variable",
        "params": ["geoid_tr", "variable" ],
        "geoid": "geoid_tr",
        "geom": None,
        "epsg": None,
        "id": None,
    },
}
