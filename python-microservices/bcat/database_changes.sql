-- required and suggested database changes
-- =======================================


/*
return bounding box geometry for a given tile in the desired coordinate system
with an optional buffer in epsg:3857 meters

select st_astext(bbox(278, 408, 10, 3857, 0));

POLYGON((-82.2656249999997 34.30714385628784,-82.2656249999997 34.01624188966682,-81.91406249999972 34.01624188966682,-81.91406249999972 34.30714385628784,-82.2656249999997 34.30714385628784))
*/

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


/*
indexes will greatly improve the performance of where clauses.

for vector tiles the geometry indexes are absolutely necessary for bounding box
indexed geometry comparisons.

for other common filter columns it wont hurt but probably wont matter until the
table is >10k records.

*/


create index if not exists bcat_bcat_auction_904_subsidy_awards_gist_geom
on bcat.bcat_auction_904_subsidy_awards
using gist(geom);

create index if not exists bcat_bcat_auction_904_subsidy_awards_btree_geoid_co
on bcat.bcat_auction_904_subsidy_awards
using btree(geoid_co);
