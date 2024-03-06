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
        "params": ["limit", "offset", "page"],
        "epsg": 4269,
        "simplify": 0.0001,
        "precision": 6
    },
    "acs_wide_tr": {
        "table": "proj_bead.acs_wide_tr",
        "api_columns": "geoid as geoid_tr, geoid_bl, year, total_population, total_households, total_housing_units, hh_w_computer, hh_w_smartphone_only, hh_wo_device, hh_using_broadband, share_w_computer, share_w_smartphone_only, share_wo_device, broadband_usage",
        "params": ["geoid_tr", "geoid_bl"],
        "geoid": "geoid_tr",
        "geom": None,
        "epsg": None,
        "id": "geoid_tr"
    },
    # "award_bl": {
    #     "table": "proj_bead.award_bl",
    #     "api_columns": "state_2010, geoid_bl_2010, block_part_flag_o, arealand_2010, areawater_2010, state_2020, geoid_bl_2020, block_part_flag_r, arealand_2020, areawater_2020, arealand_int, areawater_int",
    #     "params": [ "geoid_bl_2020" ],
    #     "geoid": "geoid_bl_2020",
    #     "geom": None,
    #     "epsg": None,
    #     "id": None
    # },
    "bead_bl": {
        "table": "proj_bead.bead_blockv1b",
        "api_columns": "geoid_bl, geoid_tr, geoid_co, geoid_st, bead_category, bl_25_3_area, bl_100_20_area, cnt_25_3, cnt_100_20, cnt_total_locations, cnt_isp, combo_isp_id, isp_id, pct_served, has_previous_funding, has_copperwire, has_coaxial_cable, has_fiber, has_wireless, only_water_flag, geom",
        "params": ["geoid_bl", "geoid_tr"],
        "geoid": "geoid_bl",
        "geom": "geom",
        "epsg": 4269,
        "id": "geoid_bl",
        "simplify": 0.0,
        "precision": 6,
        "limit": 1000  # some tracts have a *lot* of blocks
    },
    "isp_id_to_combo_isp_id": {
        "table": "proj_bead.isp_id_to_combo_isp_id_v1",
        "api_columns": "isp_id::int, new_alias, array_to_string(ARRAY_AGG(agg_isp_id),',') as agg_isp_id, array_to_string(ARRAY_AGG(combo_isp_id),',') as combo_isp_id",
        "params": ["isp_id"],
        "geoid": None,
        "geom": None,
        "epsg": None,
        "id": None,
        "limit": 100000  # some tracts have a *lot* of blocks
    },
    "isp_tech_bl": {
        "table": "proj_bead.isp_tech_bl",
        "api_columns": "geoid_bl, new_alias, isp_id, technology, max_down, max_up",
        "params": ["geoid_bl", "isp_id", "technology"],
        "geoid": "geoid_bl",
        "geom": None,
        "epsg": None,
        "id": None
    },
    "rdof_bl": {
        "table": "proj_bead.rdof_bl",
        "alias": "rdof",
        "api_columns": "rdof.applicant, rdof.winning_bi, rdof.state, county, rdof.geoid_bl as geoid_bl_2010, rdof.da_numbers, rdof.geoid_co, rdof.tier, rdof.latency, rdof.frn, rdof.sac, rdof.winning_bidder, rdof.winning_bid_total_in_state, rdof.number_of_locations_in_state, rdof.authorized, rdof.\"default\", rdof.version",
        "params": ["applicant", "geoid_bl", "geoid_co", "version"],
        "geoid": "geoid_bl",
        "geom": None,
        "epsg": None,
        "id": None
    }
}
