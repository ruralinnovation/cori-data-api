-- required and suggested database changes
-- =======================================

-- Check table ownership
SELECT *
FROM   pg_tables
WHERE  tablename NOT LIKE 'pg\_%'
ORDER  BY tablename;

-- Set owner to admin@AWS.RURALINNOVATION.US for all non-pg-system tables --
DO
$$
    DECLARE
        tbl   record;
    BEGIN
        FOR tbl IN
            SELECT *
            FROM   pg_tables
            WHERE  tablename NOT LIKE 'pg\_%'
            ORDER  BY tablename
            LOOP
                EXECUTE 'ALTER TABLE '
                            || quote_ident(tbl.schemaname) || '.' || quote_ident(tbl.tablename)
                    || ' OWNER TO "admin@AWS.RURALINNOVATION.US"';
            END LOOP;
    END
$$;

-- -- Examine acs tables
-- set schema 'acs';
-- --# acs_5_yr_county
--
-- --## query
-- select geoid_co, variable, estimate
--     from acs_5_yr_county
--     where variable in ('race_white_non_hispanic_pct',
--                        'race_black_or_african_american_non_hispanic_pct',
--                        'race_american_indian_and_alaska_native_non_hispanic_pct',
--                        'race_asian_non_hispanic_pct',
--                        'race_native_hawaiian_and_other_pacific_islander_non_hispanic_pct',
--                        'race_some_other_race_non_hispanic_pct',
--                        'two_or_more_races_non_hispanic_pct') and year = (select max(year) from acs_5_yr_county);
--
-- --## NB will need to reshape from long to wide format
--

-- -- Examine sch_broadband tables
-- set schema 'sch_broadband';
-- --# county_providers

-- -- List bcat tables
SELECT * FROM   pg_tables
         WHERE schemaname = 'bcat'
         ORDER  BY tablename;
-- --# bcat_auction_904_subsidy_awards
-- --# bcat_broadband_unserved_blocks
-- --# bcat_county_broadband_farm_bill_eligibility
-- --# bcat_county_broadband_pending_rural_dev
-- --# bcat_county_ilecs_geo
-- --# bcat_county_summary
-- --# bcat_fiber_cable_unserved_blocks
-- --# bcat_incumbent_electric_providers_geo
--
-- set schema 'bcat';
-- set search_path TO 'bcat','public';
--
-- /*
-- some tables have columns with "." in them which is a big no no
-- name.x, name.y in bcat_county_rural_dev_broadband_protected_borrowers
--
-- */
--
-- /*
-- consider adding id columns
-- */
-- alter table bcat.bcat_auction_904_subsidy_awards add column if not exists fid serial;
-- alter table bcat.bcat_broadband_unserved_blocks add column if not exists fid serial;
-- alter table bcat.bcat_county_broadband_farm_bill_eligibility add column if not exists fid serial;
-- alter table bcat.bcat_county_broadband_pending_rural_dev add column if not exists fid serial;
-- alter table bcat.bcat_county_ilecs_geo add column if not exists fid serial;
-- alter table bcat.bcat_county_rural_dev_broadband_protected_borrowers add column if not exists fid serial;
-- alter table bcat.bcat_county_summary add column if not exists fid serial;
-- alter table bcat.bcat_incumbent_electric_providers_geo add column if not exists fid serial;
-- alter table bcat.county_adjacency_crosswalk add column if not exists fid serial;
--
-- /*
-- indexes will greatly improve the performance of where clauses.
--
-- for vector tiles the geometry indexes are absolutely necessary for bounding box
-- indexed geometry comparisons.
--
-- for other common filter columns it wont hurt but probably wont matter until the
-- table is >10k records.
--
-- */
-- -- Ex.
--
-- create index if not exists bcat_bcat_auction_904_subsidy_awards_btree_geoid_co
--     on bcat.bcat_auction_904_subsidy_awards
--         using btree(geoid_co);
--
-- create index if not exists bcat_bcat_auction_904_subsidy_awards_gist_geom
--     on bcat.bcat_auction_904_subsidy_awards
--         using gist(geom);

--
-- SEE bcat_schmea_updates.sql for more changes to bcat schema
--

-- -- Examine location_analysis (la) tables
-- set schema 'location_analysis';
-- --# la_county
--
-- --## query
-- select geoid_co, cable_pct_blocks_served, fiber_pct_blocks_served,
--        broadband_25_3_pct_blocks_served,  broadband_100_20_pct_blocks_served,
--        hh_served_fiber, hh_served_cable, hh_served_fiber_cable, hh_no_fiber_cable,pct_hh_served_fiber,
--        pct_hh_served_cable, pct_hh_served_fiber_cable, pct_hh_no_fiber_cable from la_county;
--

-- -- Examine sch_census_tiger tables
-- set schema 'sch_census_tiger';
-- --# source_tiger_2019_county
--
-- --## query
-- select "GEOID" as geoid_co, "INTPTLAT" as lat, "INTPTLON", "NAMELSAD" as county_name, geometry from source_tiger_2019_county;
--

-- Auxilary tables used to populate stats in county_summary:
-- -- location_analysis.la_county
-- -- sch_census_tiger.tiger_2019_county
-- -- core_data.fcc_staff_estimates
-- -- sch_broadband.broadband_f477_2020december_v1
-- -- sch_broadband.broadband_f477_byblock_2020december_v1

-- -- Add bbox function needed by python lambda
-- set schema 'public';
--
-- /*
-- return bounding box geometry for a given tile in the desired coordinate system
-- with an optional buffer in epsg:3857 meters
--
-- select st_astext(bbox(278, 408, 10, 3857, 0));
--
-- POLYGON((-82.2656249999997 34.30714385628784,-82.2656249999997 34.01624188966682,-81.91406249999972 34.01624188966682,-81.91406249999972 34.30714385628784,-82.2656249999997 34.30714385628784))
-- */
CREATE OR REPLACE FUNCTION bbox(x integer, y integer, zoom integer, epsg integer, buffer numeric)
    RETURNS geometry AS
$BODY$
DECLARE
    max numeric := 6378137 * pi();
    res numeric := max * 2 / 2^zoom;
    bbox geometry;
BEGIN
    return st_transform(ST_MakeEnvelope(
        (-max + (x * res)) - buffer,
        (max - (y * res)) + buffer,
        (-max + (x * res) + res) + buffer,
        (max - (y * res) - res) - buffer,
        3857), epsg);
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE;

