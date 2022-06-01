import itertools
import os
import psycopg
import boto3
import json
import base64
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError


logger = Logger(service="LocalApi")
tracer = Tracer(service="LocalApi")
app = APIGatewayRestResolver(strip_prefixes=["/local"])


DB_ARGS = {
    'user': os.environ['DB_USER'],
    'password': os.environ['SECRET'],
    'host': os.environ['DB_HOST'],
    'dbname': os.environ['DB_NAME'],
}

CONFIG = {
    'auction_904_subsidy_awards': {
        'table': 'bcat.bcat_auction_904_subsidy_awards',
        'columns': "name_co, subsidy_recipient, tier, geoid_co, state_abbr",
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4326
    },
    'broadband_unserved_blocks': {
        'table': 'bcat.bcat_broadband_unserved_blocks',
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_broadband_farm_bill_eligibility': {
        'table': 'bcat.bcat_county_broadband_farm_bill_eligibility',
        'params': ['state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_broadband_pending_rural_dev': {
        'table': 'bcat.bcat_county_broadband_pending_rural_dev',
        'params': ['state_abbr', 'geom'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_ilecs_geo': {
        'table': 'bcat.bcat_county_ilecs_geo',
        'params': ['state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_rural_dev_broadband_protected_borrowers': {
        'table': 'bcat.bcat_county_rural_dev_broadband_protected_borrowers',
        'params': ['geom', 'stusps'],
        'geom': 'geoms',
        'epsg': 4269
    },
    'county_summary': {
        'table': 'bcat.bcat_county_summary',
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': None,  # has wkt geom but is text type
        'epsg': None
    },
    'fiber_cable_unserved_blocks': {
        'table': 'bcat.bcat_fiber_cable_unserved_blocks',
        'params': ['geoid_co', 'state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'incumbent_electric_providers_geo': {
        'table': 'bcat.bcat_incumbent_electric_providers_geo',
        'params': ['state_abbr', 'geom'],
        'geom': 'geometry',
        'epsg': 4269
    },
    'county_adjacency_crosswalk': {
        'table': 'bcat.county_adjacency_crosswalk',
        'params': ['geoid_co', 'state_abbr'],
        'geom': None,
        'epsg': None
    },
}


def execute(query):
    with psycopg.connect(**DB_ARGS) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


@app.get("/bcat/<table>/geojson/<state_abbr>")
def get_table_json_state(table, state_abbr):
    params = app.current_event.query_string_parameters

    if params is None:
        params = {}

    if table == 'county_rural_dev_broadband_protected_borrowers':
        params['stusps'] = state_abbr
    else:
        params['state_abbr'] = state_abbr

    return get_bcat(table, params)


@app.get("/bcat/<table>/geojson")
def get_table_json_state(table):
    params = app.current_event.query_string_parameters
    return get_bcat(table, params)


def get_bcat(table, params):
    logger.info(os.environ)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    invalid_params = [k for k in params.keys() if k not in CONFIG[table]['params']]
    if invalid_params:
        raise BadRequestError(f'invalid parameter {invalid_params}')

    if ';' in str(params):
        raise BadRequestError(f'invalid parameter')

    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    limit = CONFIG[table].get('limit', 10)

    criteria = []
    if 'geom' in params:
        criteria += [f"""
            {geom} && st_transform(st_geomfromtext('{params['geom']}', 4326), {epsg})
            AND st_intersects({geom}, st_transform(st_geomfromtext('{params['geom']}', 4326), {epsg}))
            """]

        del params['geom']

    params.update({k: [v, ] for k, v in params.items() if type(v) != list})
    params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in params.items()})
    for k, v in params.items():
        criteria += [f'{k} = {v}', ]

    where = ''
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    query = f"""
        SELECT
            json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(t.*)::json
            )
        FROM (
            SELECT {columns} 
            FROM {db_table}
            {where}
            LIMIT {limit}
            ) t
        
        """
    result = execute(query)[0][0]

    if type(result['features']) != list:
        result['features'] = []

    return result

    #return {'q': query.replace('\n', ' ')}

@app.get("/bcat/tiles/<table>/<z>/<x>/<y>.pbf")
def get_tile(table, z, x, y):
    logger.info(os.environ)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    if 'geom' not in CONFIG[table]['params']:
        raise BadRequestError(f'no geometry: {table}')

    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('columns', '*')
    geom = CONFIG[table]['geom']
    epsg = CONFIG[table]['epsg']

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

    # need to configure something to allow returning binary data response
    # return execute(query)[0][0]
    return {'r': str(execute(query)[0][0])}


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)