import os
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

from bcat_config import CONFIG
from bcat_connection import execute

logger = Logger(service="BCAT")
tracer = Tracer(service="BCAT")
app = APIGatewayRestResolver(strip_prefixes=["/bcat"])


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


@app.get("/<table>/geojson", compress=True)
def get_bcat(table):
    """
    construct and execute a query to <table> with where clause based on <params>
    """
    logger.info(os.environ)

    params = app.current_event.query_string_parameters

    # check that the table, parameters, and filter values are all acceptable.
    #   - allowed tables are top level keys in CONFIG.
    #   - allowed params are listed in CONFIG[table]["params"]
    #   - no semicolons to prevent some sql injection style attacks though those wouldnt work anyway because the
    #       filter values are constructed as text array literals and cant ever be executed.
    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    invalid_params = [k for k in params.keys() if k not in CONFIG[table]['params']]
    if invalid_params:
        raise BadRequestError(f'invalid parameter {invalid_params}')

    if ';' in str(params):
        raise BadRequestError(f'invalid parameter')

    # get some short names of parameters used to construct the query
    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    simplify = CONFIG[table].get('simplify', 0.0)
    id = CONFIG[table].get('id', None)

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id,')
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, 4326), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

    # option to limit the total number of records returned. dont include this key in the config to disable
    limit = ''
    if 'limit' in CONFIG[table]:
        limit = f"LIMIT {CONFIG[table]['limit']}"

    # criteria is a list of where clauses for the query.
    criteria = []

    # first handle a potential spatial intersection then remove this parameter and construct the rest.
    if 'geom' in params:
        criteria += [f"""
            st_intersects({geom}, st_transform(st_geomfromtext('{params['geom']}', 4326), {epsg}))
            """]

        del params['geom']

    # since we want to handle one or more parameter values coerce all to list
    # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
    params.update({k: [v, ] for k, v in params.items() if type(v) != list})
    params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in params.items()})
    for k, v in params.items():
        criteria += [f'{k} = {v}', ]

    # join the criteria so that we get the right syntax for any number of clauses
    where = ''
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    # build the query statement
    query = f"""
        SELECT
            json_build_object(
                'type',       'Feature',
                'id',         x_id, 
                'geometry',   ST_AsGeoJSON(geom)::jsonb,
                'properties', to_jsonb(t.*) - 'x_id' - 'geom'
            )
        FROM (
            SELECT {columns} 
            FROM {db_table}
            {where}
            {limit}
            ) t
        
        """

    # execute the query string.
    features = execute(query)

    result = {
        'type': 'FeatureCollection',
        'features': [f[0] for f in features],
        }

    return result


@app.get("/<table>/tiles/<z>/<x>/<y>.pbf")
def get_tile(table, z, x, y):
    """generate mvt tiles"""
    logger.info(os.environ)

    # only tables listed in config are permitted and they must have a geometry column name configured.
    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    if 'geom' not in CONFIG[table]['params']:
        raise BadRequestError(f'no geometry: {table}')

    # define some temporary variables to make the query pattern cleaner
    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('tile_columns', '*')
    geom = CONFIG[table]['geom']
    epsg = CONFIG[table]['epsg']

    # build the mvt query. you can find a similar query explained here
    # https://www.crunchydata.com/blog/dynamic-vector-tiles-from-postgis
    # bbox function must be created once and is defined in database_changes.sql
    query = f"""
        SELECT ST_AsMVT(q, '{table}', 4096, 'geom')
        
        FROM (
            SELECT {columns},
            ST_AsMvtGeom(
                st_transform({geom}, 3857),
                BBox({x}, {y}, {z}, 3857, 0),
                4096,
                256
                ) AS geom
            FROM {db_table}
            WHERE {geom} && BBox({x}, {y}, {z}, {epsg}, 0)
            AND st_intersects({geom}, BBox({x}, {y}, {z}, {epsg}, 0))
            ) AS q;
        """

    tile_data = execute(query)[0][0]
    return Response(status_code=200, content_type='application/x-protobuf', body=tile_data)


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)