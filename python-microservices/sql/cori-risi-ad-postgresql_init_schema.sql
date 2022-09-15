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
--
-- set schema 'sch_broadband';
-- --# county_providers
--
-- set schema 'bcat';
-- --# bcat_auction_904_subsidy_awards
-- --# bcat_broadband_unserved_blocks
-- --# bcat_county_broadband_farm_bill_eligibility
-- --# bcat_county_broadband_pending_rural_dev
-- --# bcat_county_ilecs_geo
-- --# bcat_county_summary
-- --# bcat_fiber_cable_unserved_blocks
-- --# bcat_incumbent_electric_providers_geo
--
--
-- set schema 'location_analysis';
-- --# la_county
--
-- --## query
-- select geoid_co, cable_pct_blocks_served, fiber_pct_blocks_served,
--        broadband_25_3_pct_blocks_served,  broadband_100_20_pct_blocks_served,
--        hh_served_fiber, hh_served_cable, hh_served_fiber_cable, hh_no_fiber_cable,pct_hh_served_fiber,
--        pct_hh_served_cable, pct_hh_served_fiber_cable, pct_hh_no_fiber_cable from la_county;
--
--
-- set schema 'sch_census_tiger';
-- --# source_tiger_2019_county
--
-- --## query
-- select "GEOID" as geoid_co, "INTPTLAT" as lat, "INTPTLON", "NAMELSAD" as county_name, geometry from source_tiger_2019_county;
--
-- set schema 'acs';
--
-- select geoid_co, variable, estimate from acs_5_yr_county
--     where variable in (
--                        'race_white_non_hispanic_pct',
--                        'race_black_or_african_american_non_hispanic_pct',
--                        'race_american_indian_and_alaska_native_non_hispanic_pct',
--                        'race_asian_non_hispanic_pct',
--                        'race_native_hawaiian_and_other_pacific_islander_non_hispanic_pct',
--                        'race_some_other_race_non_hispanic_pct',
--                        'two_or_more_races_non_hispanic_pct') and year = (select max(year) from acs_5_yr_county);

-- Auxilary tables used to populate stats in county_summary:
-- -- location_analysis.la_county
-- -- sch_census_tiger.tiger_2019_county
-- -- core_data.fcc_staff_estimates
-- -- sch_broadband.broadband_f477_2020december_v1
-- -- sch_broadband.broadband_f477_byblock_2020december_v1

-- set schema 'public';
--
-- CREATE OR REPLACE FUNCTION bbox(x integer, y integer, zoom integer, epsg integer, buffer numeric)
--     RETURNS geometry AS
-- $BODY$
-- DECLARE
-- max numeric := 6378137 * pi();
--     res numeric := max * 2 / 2^zoom;
--     bbox geometry;
-- BEGIN
-- return st_transform(ST_MakeEnvelope(
--                                 (-max + (x * res)) - buffer,
--                                 (max - (y * res)) + buffer,
--                                 (-max + (x * res) + res) + buffer,
--                                 (max - (y * res) - res) - buffer,
--                                 3857), epsg);
-- END;
-- $BODY$
-- LANGUAGE plpgsql IMMUTABLE;

-- SET search_path TO 'bcat','public';
--
-- alter table bcat.bcat_county_summary
--     add column if not exists geom geometry(multipolygon, 4269);
--
-- update bcat.bcat_county_summary
-- set geom = st_transform(st_geomfromtext(wkt_geom, 4326), 4269);

alter table bcat.county_summary
    add column if not exists geom geometry(multipolygon, 4269);
update bcat.county_summary
    set geom = st_transform(st_geomfromtext(wkt_geom, 4326), 4269);

SET SCHEMA 'bcat';
SET search_path TO 'bcat', 'public';

SELECT ST_SRID(b.geom) from bcat.bcat_auction_904_subsidy_awards b LIMIT 10;

ALTER TABLE bcat_auction_904_subsidy_awards;
ALTER COLUMN geom TYPE geometry(multipolygon, 4326)
    USING ST_SetSRID(ST_Multi(geom) ,4326);

SELECT ST_SRID(b.geometry) from bcat.bcat_broadband_unserved_blocks b LIMIT 10;

ALTER TABLE bcat.bcat_broadband_unserved_blocks
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_broadband_unserved_blocks
    SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);

SELECT ST_SRID(b.geoms) from bcat.bcat_county_broadband_farm_bill_eligibility b LIMIT 10;

ALTER TABLE bcat.bcat_county_broadband_farm_bill_eligibility;
ALTER COLUMN geoms TYPE geometry(multipolygon, 4269)
        USING ST_SetSRID(ST_Multi(geoms) ,4269);

ALTER TABLE bcat.bcat_county_broadband_farm_bill_eligibility
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_county_broadband_farm_bill_eligibility
    SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);

SELECT ST_SRID(b.geoms) from bcat.bcat_county_broadband_pending_rural_dev b LIMIT 10;

ALTER TABLE bcat.bcat_county_broadband_pending_rural_dev
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_county_broadband_pending_rural_dev
    SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);
ALTER TABLE IF EXISTS bcat.bcat_county_broadband_pending_rural_dev DROP COLUMN IF EXISTS geoms;

ALTER TABLE bcat.bcat_county_ilecs_geo
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_county_ilecs_geo
    SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);
ALTER TABLE IF EXISTS bcat.bcat_county_ilecs_geo
    DROP COLUMN IF EXISTS geometry;

ALTER TABLE bcat.bcat_county_rural_dev_broadband_protected_borrowers
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_county_rural_dev_broadband_protected_borrowers
    SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);
ALTER TABLE IF EXISTS bcat.bcat_county_rural_dev_broadband_protected_borrowers
    DROP COLUMN IF EXISTS geoms;

ALTER TABLE bcat.bcat_fiber_cable_unserved_blocks
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_fiber_cable_unserved_blocks
    SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);
ALTER TABLE IF EXISTS bcat.bcat_fiber_cable_unserved_blocks
    DROP COLUMN IF EXISTS geometry;

ALTER TABLE bcat.bcat_incumbent_electric_providers_geo
    ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
UPDATE bcat.bcat_incumbent_electric_providers_geo
    SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);
ALTER TABLE IF EXISTS bcat.bcat_incumbent_electric_providers_geo
    DROP COLUMN IF EXISTS geometry;
