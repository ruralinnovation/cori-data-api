"""
places configuration

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
        "params": ["limit", "offset", "page", "geoid_bl", "geoid_tr", "geoid_co", "geoid_st"],
        "epsg": 4269,
        "simplify": 0.0001,
        "precision": 6
    },
    # "acs_wide_co": {
    #     "table": "proj_bead.acs_wide_co_v3",
    #     "alias": "acs_co",
    #     "api_columns": "acs_co.geoid_co, acs_co.year, acs_co.total_population, "
    #                    "acs_co.total_households, acs_co.total_housing_units,"
    #                    "acs_co.hh_w_computer, acs_co.hh_w_smartphone_only, "
    #                    "acs_co.hh_wo_device, acs_co.hh_using_broadband",
    #     "params": ["geoid_co", "geoid_bl"],
    #     "geoid": "geoid_co",
    #     "geom": None,
    #     "epsg": None,
    #     "id": "geoid_co"
    # },
    # "bead_co": {
    #     "table": "proj_bead.bead_county_v3",
    #     "alias": "bead_co",
    #     "api_columns": "bead_co.cnt_total_locations, bead_co.cnt_25_3, bead_co.cnt_100_20, "
    #                    "bead_co.cnt_100_20_dsl_excluded, bead_co.isp_id, bead_co.geom",
    #     "params": ["geoid_co", "geoid_bl"],
    #     "geoid": "geoid_co",
    #     "geom": "geom",
    #     "epsg": 4269,
    #     "id": "geoid_co",
    #     "simplify": 0.0,
    #     "precision": 5,
    #     "limit": 5000
    # },
    "tiger_place": {
        "table": "sch_census_tiger.source_tiger_2021_place",
        "alias": "tiger_place",
        "api_columns": '"GEOID" as geoid_pl, "NAME", "NAMELSAD", "INTPTLON" as lon, "INTPTLAT" as lat, ST_Centroid("geometry") as geom', # ""STUSPS", pct_rural, rural_flag, pop, lon, lat, geom",
        # "agg_columns": "geoid_co, "
        #                "geoid_st, "
        #                "ARRAY_TO_STRING(ARRAY( "
        #                "    SELECT DISTINCT e FROM UNNEST( "
        #                "        STRING_TO_ARRAY(STRING_AGG(geoid_tr, ','), ',') "
        #                "    ) AS a(e) "
        #                "), ',') geoid_tr, "
        #                "STRING_AGG(geoid_bl, ',') as geoid_bl, "
        #                "ARRAY_TO_STRING(ARRAY( "
        #                "    SELECT DISTINCT e FROM UNNEST( "
        #                "        STRING_TO_ARRAY(STRING_AGG(bead_category, ','), ',') "
        #                "    ) AS a(e) "
        #                "), ',') as bead_category, "
        #                "ARRAY_TO_STRING(ARRAY( "
        #                "    SELECT DISTINCT e FROM UNNEST( "
        #                "        STRING_TO_ARRAY(STRING_AGG(bead_category_dsl_excluded, ','), ',') "
        #                "    ) AS a(e) "
        #                "), ',') as bead_category_dsl_excluded, "
        #                "SUM(cnt_total_locations) as cnt_total_locations, "
        #                "SUM(cnt_25_3) as cnt_25_3, "
        #                "SUM(cnt_100_20) as cnt_100_20, "
        #                "SUM(cnt_100_20_dsl_excluded) as cnt_100_20_dsl_excluded, "
        #                "SUM(cnt_underserved) as cnt_underserved, "
        #                "SUM(cnt_underserved_dsl_excluded) as cnt_underserved_dsl_excluded, "
        #                "coalesce(array_length(ARRAY( "
        #                "    SELECT DISTINCT e FROM UNNEST( "
        #                "        STRING_TO_ARRAY(REPLACE(REPLACE(STRING_AGG(isp_id, ','), '{', ''), '}', ''), ',') "
        #                "    ) AS a(e) "
        #                "), 1), 0) as cnt_isp, "
        #                "ARRAY( "
        #                "    SELECT DISTINCT e FROM UNNEST( "
        #                "        STRING_TO_ARRAY(REPLACE(REPLACE(STRING_AGG(isp_id, ','), '{', ''), '}', ''), ',') "
        #                "    ) AS a(e) "
        #                ") as isp_id, "
        #                "BOOL_OR(has_previous_funding) as has_previous_funding, "
        #                "BOOL_OR(has_copperwire) as has_copperwire, "
        #                "BOOL_OR(has_coaxial_cable) as has_coaxial_cable, "
        #                "BOOL_OR(has_fiber) as has_fiber, "
        #                "BOOL_OR(has_wireless) as has_wireless, "
        #                "ST_SIMPLIFY(ST_TRANSFORM(ST_Multi(ST_Union(ST_MakeValid(geom))), 4326), 0.0) as geom, "
        #                "'geojson' as type ",
        "params": ["geoid_pl", "geom"],
        # "group_by": "geoid_co, geoid_st",
        "geoid": "geoid_pl",
        "geom": "geom",
        "epsg": 4269,
        "id": "GEOID",
        "simplify": 0.0,
        "precision": 6,
        "limit": 50000
    }
}
