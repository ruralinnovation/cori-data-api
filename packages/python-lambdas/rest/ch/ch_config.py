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
    "global": {
        "params": [ "limit", "offset", "page" ],
        "epsg": 4269,
        "simplify": 0.0001,
        "precision": 6
    },
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
        "params": [ "geoid_tr", "variable" ],
        "geoid": "geoid_tr",
        "geom": None,
        "epsg": None,
        "id": None,
    },
    "ch_app_wide_county": {
        "table": "sch_proj_climate.ch_app_wide_county",
        "api_columns": "geoid_co, coastal_flooding_ealb, coastal_flooding_ealb_rank, coastal_flooding_ealb_rating_hazard, coastal_flooding_ealb_score_hazard, cold_wave_ealb, cold_wave_ealb_rank, cold_wave_ealb_rating_hazard, cold_wave_ealb_score_hazard, earthquake_ealb, earthquake_ealb_rank, earthquake_ealb_rating_hazard, earthquake_ealb_score_hazard, hail_ealb, hail_ealb_rank, hail_ealb_rating_hazard, hail_ealb_score_hazard, heat_wave_ealb, heat_wave_ealb_rank, heat_wave_ealb_rating_hazard, heat_wave_ealb_score_hazard, hurricane_ealb, hurricane_ealb_rank, hurricane_ealb_rating_hazard, hurricane_ealb_score_hazard, ice_storm_ealb, ice_storm_ealb_rank, ice_storm_ealb_rating_hazard, ice_storm_ealb_score_hazard, lightning_ealb, lightning_ealb_rank, lightning_ealb_rating_hazard, lightning_ealb_score_hazard, overall_loss_rating, overall_loss_score, pct_bb_100_20, pct_bb_25_3, pct_bb_fiber, riverine_flooding_ealb, riverine_flooding_ealb_rank, riverine_flooding_ealb_rating_hazard, riverine_flooding_ealb_score_hazard, strong_wind_ealb, strong_wind_ealb_rank, strong_wind_ealb_rating_hazard, strong_wind_ealb_score_hazard, tornado_ealb, tornado_ealb_rank, tornado_ealb_rating_hazard, tornado_ealb_score_hazard, tsunami_ealb, tsunami_ealb_rank, tsunami_ealb_rating_hazard, tsunami_ealb_score_hazard, wildfire_ealb, wildfire_ealb_rank, wildfire_ealb_rating_hazard, wildfire_ealb_score_hazard",
        "params": [ "geoid_co" ],
        "geoid": "geoid_co",
        "geom": None,
        "epsg": None,
        "id": "geoid_co",
    },
    "ch_app_wide_tract": {
        "table": "sch_proj_climate.ch_app_wide_tract",
        "api_columns": "geoid_tr, coastal_flooding_afreq, coastal_flooding_ealb, coastal_flooding_ealb_rank, coastal_flooding_ealb_rating_hazard, coastal_flooding_ealb_score_hazard, coastal_flooding_expb, coastal_flooding_hlrb, cold_wave_afreq, cold_wave_ealb, cold_wave_ealb_rank, cold_wave_ealb_rating_hazard, cold_wave_ealb_score_hazard, cold_wave_expb, cold_wave_hlrb, earthquake_afreq, earthquake_ealb, earthquake_ealb_rank, earthquake_ealb_rating_hazard, earthquake_ealb_score_hazard, earthquake_expb, earthquake_hlrb, hail_afreq, hail_ealb, hail_ealb_rank, hail_ealb_rating_hazard, hail_ealb_score_hazard, hail_expb, hail_hlrb, heat_wave_afreq, heat_wave_ealb, heat_wave_ealb_rank, heat_wave_ealb_rating_hazard, heat_wave_ealb_score_hazard, heat_wave_expb, heat_wave_hlrb, hurricane_afreq, hurricane_ealb, hurricane_ealb_rank, hurricane_ealb_rating_hazard, hurricane_ealb_score_hazard, hurricane_expb, hurricane_hlrb, ice_storm_afreq, ice_storm_ealb, ice_storm_ealb_rank, ice_storm_ealb_rating_hazard, ice_storm_ealb_score_hazard, ice_storm_expb, ice_storm_hlrb, lightning_afreq, lightning_ealb, lightning_ealb_rank, lightning_ealb_rating_hazard, lightning_ealb_score_hazard, lightning_expb, lightning_hlrb, overall_loss_rating, overall_loss_score, pct_bb_100_20, pct_bb_25_3, pct_bb_fiber, riverine_flooding_afreq, riverine_flooding_ealb, riverine_flooding_ealb_rank, riverine_flooding_ealb_rating_hazard, riverine_flooding_ealb_score_hazard, riverine_flooding_expb, riverine_flooding_hlrb, strong_wind_afreq, strong_wind_ealb, strong_wind_ealb_rank, strong_wind_ealb_rating_hazard, strong_wind_ealb_score_hazard, strong_wind_expb, strong_wind_hlrb, tornado_afreq, tornado_ealb, tornado_ealb_rank, tornado_ealb_rating_hazard, tornado_ealb_score_hazard, tornado_expb, tornado_hlrb, tsunami_afreq, tsunami_ealb, tsunami_ealb_rank, tsunami_ealb_rating_hazard, tsunami_ealb_score_hazard, tsunami_expb, tsunami_hlrb, wildfire_afreq, wildfire_ealb, wildfire_ealb_rank, wildfire_ealb_rating_hazard, wildfire_ealb_score_hazard, wildfire_expb, wildfire_hlrb",
        "params": ["geoid_tr" ],
        "geoid": "geoid_tr",
        "geom": None,
        "epsg": None,
        "id": "geoid_tr",
    },
    "ch_app_wide_county_geo": {
        "table": "sch_proj_climate.ch_app_wide_county_geo",
        "api_columns": "geoid_co, namelsad, coastal_flooding_ealb, coastal_flooding_ealb_rank, coastal_flooding_ealb_rating_hazard, coastal_flooding_ealb_score_hazard, cold_wave_ealb, cold_wave_ealb_rank, cold_wave_ealb_rating_hazard, cold_wave_ealb_score_hazard, earthquake_ealb, earthquake_ealb_rank, earthquake_ealb_rating_hazard, earthquake_ealb_score_hazard, hail_ealb, hail_ealb_rank, hail_ealb_rating_hazard, hail_ealb_score_hazard, heat_wave_ealb, heat_wave_ealb_rank, heat_wave_ealb_rating_hazard, heat_wave_ealb_score_hazard, hurricane_ealb, hurricane_ealb_rank, hurricane_ealb_rating_hazard, hurricane_ealb_score_hazard, ice_storm_ealb, ice_storm_ealb_rank, ice_storm_ealb_rating_hazard, ice_storm_ealb_score_hazard, lightning_ealb, lightning_ealb_rank, lightning_ealb_rating_hazard, lightning_ealb_score_hazard, overall_loss_rating, overall_loss_score, pct_bb_100_20, pct_bb_25_3, pct_bb_fiber, riverine_flooding_ealb, riverine_flooding_ealb_rank, riverine_flooding_ealb_rating_hazard, riverine_flooding_ealb_score_hazard, strong_wind_ealb, strong_wind_ealb_rank, strong_wind_ealb_rating_hazard, strong_wind_ealb_score_hazard, tornado_ealb, tornado_ealb_rank, tornado_ealb_rating_hazard, tornado_ealb_score_hazard, tsunami_ealb, tsunami_ealb_rank, tsunami_ealb_rating_hazard, tsunami_ealb_score_hazard, wildfire_ealb, wildfire_ealb_rank, wildfire_ealb_rating_hazard, wildfire_ealb_score_hazard, geom",
        "params": [ "geoid_co", "lat", "lon" ],
        "geoid": "geoid_co",
        "geom": "geom",
        "epsg": 4269,
        "id": "geoid_co",
        "simplify": 0.001,
        "precision": 6,
        "limit": 255 # Texas has 254 counties... https://simple.wikipedia.org/wiki/List_of_counties_in_Texas
    },
    "ch_app_wide_tract_geo": {
        "table": "sch_proj_climate.ch_app_wide_tract_geo",
        "api_columns": "geoid_tr, namelsad, coastal_flooding_afreq, coastal_flooding_ealb, coastal_flooding_ealb_rank, coastal_flooding_ealb_rating_hazard, coastal_flooding_ealb_score_hazard, coastal_flooding_expb, coastal_flooding_hlrb, cold_wave_afreq, cold_wave_ealb, cold_wave_ealb_rank, cold_wave_ealb_rating_hazard, cold_wave_ealb_score_hazard, cold_wave_expb, cold_wave_hlrb, earthquake_afreq, earthquake_ealb, earthquake_ealb_rank, earthquake_ealb_rating_hazard, earthquake_ealb_score_hazard, earthquake_expb, earthquake_hlrb, hail_afreq, hail_ealb, hail_ealb_rank, hail_ealb_rating_hazard, hail_ealb_score_hazard, hail_expb, hail_hlrb, heat_wave_afreq, heat_wave_ealb, heat_wave_ealb_rank, heat_wave_ealb_rating_hazard, heat_wave_ealb_score_hazard, heat_wave_expb, heat_wave_hlrb, hurricane_afreq, hurricane_ealb, hurricane_ealb_rank, hurricane_ealb_rating_hazard, hurricane_ealb_score_hazard, hurricane_expb, hurricane_hlrb, ice_storm_afreq, ice_storm_ealb, ice_storm_ealb_rank, ice_storm_ealb_rating_hazard, ice_storm_ealb_score_hazard, ice_storm_expb, ice_storm_hlrb, lightning_afreq, lightning_ealb, lightning_ealb_rank, lightning_ealb_rating_hazard, lightning_ealb_score_hazard, lightning_expb, lightning_hlrb, overall_loss_rating, overall_loss_score, pct_bb_100_20, pct_bb_25_3, pct_bb_fiber, riverine_flooding_afreq, riverine_flooding_ealb, riverine_flooding_ealb_rank, riverine_flooding_ealb_rating_hazard, riverine_flooding_ealb_score_hazard, riverine_flooding_expb, riverine_flooding_hlrb, strong_wind_afreq, strong_wind_ealb, strong_wind_ealb_rank, strong_wind_ealb_rating_hazard, strong_wind_ealb_score_hazard, strong_wind_expb, strong_wind_hlrb, tornado_afreq, tornado_ealb, tornado_ealb_rank, tornado_ealb_rating_hazard, tornado_ealb_score_hazard, tornado_expb, tornado_hlrb, tsunami_afreq, tsunami_ealb, tsunami_ealb_rank, tsunami_ealb_rating_hazard, tsunami_ealb_score_hazard, tsunami_expb, tsunami_hlrb, wildfire_afreq, wildfire_ealb, wildfire_ealb_rank, wildfire_ealb_rating_hazard, wildfire_ealb_score_hazard, wildfire_expb, wildfire_hlrb, geom",
        "params": ["geoid_tr", "lat", "lon" ],
        "geoid": "geoid_tr",
        "geom": "geom",
        "epsg": 4269,
        "id": "geoid_tr",
        "simplify": 0.001,
        "precision": 6,
        "limit": 1000 # some counties have a *lot* of tracts
    },
    "bb_map_bl": {
        "table": "sch_broadband.bb_map_bl_2022decareav3e",
        "api_columns": "geoid_bl, geoid_tr, geoid_co, bl_25_3_area, bl_100_20_area, category, cnt_total_locations, cnt_fiber_locations, cnt_100_20, pct_100_20, cnt_25_3, pct_25_3, geom",
        "params": ["geoid_tr" ],
        "geoid": "geoid_tr",
        "geom": "geom",
        "epsg": 4269,
        "id": "geoid_bl",
        "simplify": 0.0,
        "precision": 6,
        "limit": 1000 # some tracts have a *lot* of blocks
    },
}
