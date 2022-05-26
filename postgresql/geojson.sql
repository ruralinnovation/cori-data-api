
SELECT
  ST_AsGeoJSON(t.*)
FROM
  bcat.bcat_auction_904_subsidy_awards AS t;


SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(t.*)::json)
  )
FROM
  bcat.bcat_auction_904_subsidy_awards AS t
 WHERE state_abbr = 'IA';

 SELECT distinct(the_geom) as distinct_geom, 
* FROM (select attr_table.the_geom,attr_table.the_geom_webmercator,attr_table.fid,attr_table.geoid_co,attr_table.state_abbr from bcat_broadband_100_20_unserved_blocks as attr_table) as complex_query where geoid_co ilike '%51057'
 