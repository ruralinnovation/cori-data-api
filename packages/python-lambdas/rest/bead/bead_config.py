"""
bead configuration

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
    "global": {
        "params": [ "limit", "offset", "page" ],
        "epsg": 4269,
        "simplify": 0.0001,
        "precision": 6
    },
    "award_bl": {
        "table": "award_bl",
        "api_columns": "state_2010, geoid_bl_2010, block_part_flag_o, arealand_2010, areawater_2010, state_2020, geoid_bl_2020, block_part_flag_r, arealand_2020, areawater_2020, arealand_int, areawater_int",
        "params": [ "geoid_bl_2020" ],
        "geoid": "geoid_bl_2020",
        "geom": None,
        "epsg": None,
        "id": None
    },
    "isp_tech_bl": {
        "table": "proj_bead.isp_tech_bl",
        "api_columns": "geoid_bl, new_alias, isp_id, technology, max_down, max_up",
        "params": [ "geoid_bl", "isp_id", "technology" ],
        "geoid": "geoid_bl",
        "geom": None,
        "epsg": None,
        "id": None
    },
    "rdof_bl": {
        "table": "proj_bead.rdof_bl",
        "api_columns": "applicant, winning_bi, state, county, geoid_bl, da_numbers, geoid_co, id, tier, latency, frn, sac, winning_bidder, winning_bid_total_in_state, number_of_locations_in_state, authorized, \"default\", version",
        "params": [ "applicant", "geoid_bl", "geoid_co", "version" ],
        "geoid": "geoid_bl",
        "geom": None,
        "epsg": None,
        "id": None
    }
}
