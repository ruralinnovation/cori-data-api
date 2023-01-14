SET SCHEMA 'bcat';
SET search_path TO 'bcat', 'public';

CREATE INDEX IF NOT EXISTS bcat_county_summary_idx_geoid_co
    ON bcat.bcat_county_summary (geoid_co);

CREATE INDEX IF NOT EXISTS bcat_county_summary_idx_state_abbr
    ON bcat.bcat_county_summary (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_county_summary_idx_geom
    ON bcat.bcat_county_summary USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_county_summary b LIMIT 10;

SELECT
    json_build_object(
            'type',       'Feature',
            'id',         x_id,
            'geometry',   ST_AsGeoJSON(geom)::jsonb,
            'properties', to_jsonb(t.*) - 'x_id' - 'geom'
        )
FROM (
         SELECT geoid_co, name_co, broadband_100_20_pct_blocks_served, cable_pct_blocks_served, fiber_pct_blocks_served, fiber_providers, cable_providers, co_fiber_pct_blocks_served, pct_hh_no_fiber_cable, pct_hh_served_fiber_cable, pct_hh_served_cable, pct_hh_served_fiber, hh_no_fiber_cable, hh_served_fiber_cable, hh_served_cable, hh_served_fiber, total_households, lat, lon, state_name, geoid_st, state_abbr, st_simplify(st_transform(geom, 4326), 0.0) as geom,  ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id
         FROM bcat.bcat_county_summary
         -- WHERE geoid_co = ANY('{47001,47003}')
         LIMIT 10

     ) t;

-- -- ALTER TABLE bcat_auction_904_subsidy_awards
-- -- ALTER COLUMN geom TYPE geometry(multipolygon, 4326)
-- --     USING ST_SetSRID(ST_Multi(geom) ,4326);
-- ALTER TABLE bcat.bcat_auction_904_subsidy_awards
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_auction_904_subsidy_awards
-- 	SET geom = ST_SetSRID(ST_Multi(geoms), 4269);
-- ALTER TABLE IF EXISTS bcat.bcat_auction_904_subsidy_awards
-- 	DROP COLUMN IF EXISTS geoms;

CREATE INDEX IF NOT EXISTS bcat_auction_904_subsidy_awards_idx_geoid_co
    ON bcat.bcat_auction_904_subsidy_awards (geoid_co);

CREATE INDEX IF NOT EXISTS bcat_auction_904_subsidy_awards_idx_state_abbr
    ON bcat.bcat_auction_904_subsidy_awards (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_auction_904_subsidy_awards_idx_geom
    ON bcat.bcat_auction_904_subsidy_awards USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_auction_904_subsidy_awards b LIMIT 10;

-- ALTER TABLE bcat.bcat_broadband_100_20_unserved_blocks
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_broadband_100_20_unserved_blocks
-- 	SET geom = ST_SetSRID(ST_Multi(geometry), 4269);
-- ALTER TABLE IF EXISTS bcat.bcat_broadband_100_20_unserved_blocks
-- 	DROP COLUMN IF EXISTS geometry;

CREATE INDEX IF NOT EXISTS bcat_broadband_100_20_unserved_blocks_idx_geoid_co
    ON bcat.bcat_broadband_100_20_unserved_blocks (geoid_co);

CREATE INDEX IF NOT EXISTS bcat_broadband_100_20_unserved_blocks_idx_state_abbr
    ON bcat.bcat_broadband_100_20_unserved_blocks (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_broadband_100_20_unserved_blocks_idx_geom
    ON bcat.bcat_broadband_100_20_unserved_blocks USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_broadband_100_20_unserved_blocks b LIMIT 10;

-- ALTER TABLE bcat.bcat_broadband_unserved_blocks
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_broadband_unserved_blocks
-- 	SET geom = ST_SetSRID(ST_Multi(geometry), 4269);
-- ALTER TABLE IF EXISTS bcat.bcat_broadband_unserved_blocks
-- 	DROP COLUMN IF EXISTS geometry;

CREATE INDEX IF NOT EXISTS bcat_broadband_unserved_blocks_idx_geoid_co
    ON bcat.bcat_broadband_unserved_blocks (geoid_co);

CREATE INDEX IF NOT EXISTS bcat_broadband_unserved_blocks_idx_state_abbr
    ON bcat.bcat_broadband_unserved_blocks (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_broadband_unserved_blocks_idx_geom
    ON bcat.bcat_broadband_unserved_blocks USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_broadband_unserved_blocks b LIMIT 10;

-- ALTER TABLE bcat.bcat_county_broadband_farm_bill_eligibility
--     ALTER COLUMN geoms TYPE geometry(multipolygon, 4269)
--         USING ST_SetSRID(ST_Multi(geoms) ,4269);
-- ALTER TABLE bcat.bcat_county_broadband_farm_bill_eligibility
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_county_broadband_farm_bill_eligibility
-- 	SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);

CREATE INDEX IF NOT EXISTS bcat_county_broadband_farm_bill_eligibility_idx_state_abbr
    ON bcat.bcat_county_broadband_farm_bill_eligibility (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_county_broadband_farm_bill_eligibility_idx_geom
    ON bcat.bcat_county_broadband_farm_bill_eligibility USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_county_broadband_farm_bill_eligibility b LIMIT 10;

-- -- ALTER TABLE bcat.bcat_county_broadband_pending_rural_dev REPLICA IDENTITY FULL;
-- ALTER TABLE bcat.bcat_county_broadband_pending_rural_dev
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_county_broadband_pending_rural_dev
-- 	SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);
-- ALTER TABLE IF EXISTS bcat.bcat_county_broadband_pending_rural_dev
-- 	DROP COLUMN IF EXISTS geoms;
-- -- ALTER TABLE IF EXISTS bcat.bcat_county_broadband_pending_rural_dev
-- --     ADD PRIMARY KEY (applicant_name, program, state_abbr, geom);

CREATE INDEX IF NOT EXISTS bcat_county_broadband_pending_rural_dev_idx_state_abbr
    ON bcat.bcat_county_broadband_pending_rural_dev (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_county_broadband_pending_rural_dev_idx_geom
    ON bcat.bcat_county_broadband_pending_rural_dev USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_county_broadband_pending_rural_dev b LIMIT 10;

-- ALTER TABLE bcat.bcat_county_ilecs_geo
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_county_ilecs_geo
--     SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);
-- ALTER TABLE IF EXISTS bcat.bcat_county_ilecs_geo
--     DROP COLUMN IF EXISTS geometry;

CREATE INDEX IF NOT EXISTS bcat_county_ilecs_geo_idx_state_abbr
    ON bcat.bcat_county_ilecs_geo (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_county_ilecs_geo_idx_geom
    ON bcat.bcat_county_ilecs_geo USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_county_ilecs_geo b LIMIT 10;

-- ALTER TABLE bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     SET geom = ST_SetSRID(ST_Multi(geoms) ,4269);
-- ALTER TABLE IF EXISTS bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     DROP COLUMN IF EXISTS geoms;
-- ALTER TABLE bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     RENAME COLUMN "name.x" TO "name";
-- ALTER TABLE bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     RENAME COLUMN "name.y" TO "state_name";
-- ALTER TABLE bcat.bcat_county_rural_dev_broadband_protected_borrowers
--     RENAME COLUMN stusps TO "state_abbr";

CREATE INDEX IF NOT EXISTS bcat_county_rural_dev_idx_state_abbr
    ON bcat.bcat_county_rural_dev_broadband_protected_borrowers (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_county_rural_dev_idx_geom
    ON bcat.bcat_county_rural_dev_broadband_protected_borrowers USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_county_rural_dev_broadband_protected_borrowers b LIMIT 10;

-- ALTER TABLE bcat.bcat_incumbent_electric_providers_geo
--     ADD COLUMN IF NOT EXISTS geom geometry(multipolygon, 4269);
-- UPDATE bcat.bcat_incumbent_electric_providers_geo
--     SET geom = ST_SetSRID(ST_Multi(geometry) ,4269);
-- ALTER TABLE IF EXISTS bcat.bcat_incumbent_electric_providers_geo
--     DROP COLUMN IF EXISTS geometry;

CREATE INDEX IF NOT EXISTS bcat_incumbent_electric_providers_geo_idx_state_abbr
    ON bcat.bcat_incumbent_electric_providers_geo (state_abbr);

CREATE INDEX IF NOT EXISTS bcat_incumbent_electric_providers_geo_idx_geom
    ON bcat.bcat_incumbent_electric_providers_geo USING GIST (geom);

SELECT ST_SRID(b.geom) from bcat.bcat_incumbent_electric_providers_geo b LIMIT 10;

--
-- ONLY RUN ON CORI-RISI-AD-POSTGRESQL DB (after restore) --
--

SELECT * FROM   pg_tables
    -- WHERE  tablename NOT LIKE 'pg\_%'
    WHERE schemaname = 'bcat'
    ORDER  BY tablename;

DO
$$
    DECLARE
        tbl   record;
    BEGIN
        FOR tbl IN
            SELECT *
            FROM   pg_tables
                   -- WHERE  tablename NOT LIKE 'pg\_%'
            WHERE schemaname = 'bcat'
            ORDER  BY tablename
            LOOP
                EXECUTE 'ALTER TABLE '
                            || quote_ident(tbl.schemaname) || '.' || quote_ident(tbl.tablename)
                    || ' OWNER TO "admin@AWS.RURALINNOVATION.US"';
            END LOOP;
    END
$$;

DO
$$
    DECLARE
        tbl   record;
    BEGIN
        FOR tbl IN
            SELECT *
            FROM   pg_tables
                   -- WHERE  tablename NOT LIKE 'pg\_%'
            WHERE schemaname = 'bcat'
            ORDER  BY tablename
            LOOP
                EXECUTE 'ALTER TABLE '
                            || quote_ident(tbl.schemaname) || '.' || quote_ident(tbl.tablename)
                    || ' OWNER TO "admin@AWS.RURALINNOVATION.US"';
            END LOOP;
    END
$$;

GRANT USAGE ON SCHEMA
    bcat to read_only_access;
GRANT SELECT ON ALL TABLES IN SCHEMA
    bcat to read_only_access;
