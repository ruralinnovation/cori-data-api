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


TILES_CONFIG = {
    'auction_904_subsidy_awards': {
        'table': 'bcat.bcat_auction_904_subsidy_awards',
        'geometry': 'geoms',
        'columns': "geoid, state_abbr, name_co, subsidy_recipient, tier, geoid_co, valid_raw"
    },
}

BCAT_CONFIG = {
    'auction_904_subsidy_awards': {
        'table': 'bcat.bcat_auction_904_subsidy_awards',
        'params': {
            'geoid_co': str,
            'tier': str,
        },
    },
    'broadband_unserved_blocks': {
        'table': 'bcat.bcat_broadband_unserved_blocks',
        'params': {
            'geoid_co': str,
            'state_abbr': str,
        }
    }
}


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


@app.get("/test/<name>")
def get_hello_you(name):
    return {"hello": f"hello {name}"}


@app.get("/test")
def get_hello():
  
    logger.info(os.environ)
    conn = psycopg.connect(
        user = os.environ['DB_USER'],
        password = os.environ['SECRET'],
        host = os.environ['DB_HOST'],
        dbname = os.environ['DB_NAME']
    )
            
    # create a cursor
    cur = conn.cursor()
    query = """
        SELECT
        json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(ST_AsGeoJSON(t.*)::json)
        )
        FROM
        bcat.bcat_auction_904_subsidy_awards AS t
        WHERE geoid_co = '48329';
    """
    cur.execute(query)
    results = cur.fetchone()

    return results[0]


@app.get("/bcat/<table>")
def get_bcat(table):

    logger.info(os.environ)

    params = app.current_event.query_string_parameters

    if table not in BCAT_CONFIG:
        raise BadRequestError(f'{table} not a valid table')

    invalid_params = [k for k in params.keys() if k not in BCAT_CONFIG[table]['params']]
    if invalid_params:
        raise BadRequestError(f'invalid parameters {invalid_params}')

    conn = psycopg.connect(
        user=os.environ['DB_USER'],
        password=os.environ['SECRET'],
        host=os.environ['DB_HOST'],
        dbname=os.environ['DB_NAME']
    )

    # create a cursor
    cur = conn.cursor()
    query = f"""        
        SELECT
        json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(ST_AsGeoJSON(t.*)::json)
        )
        FROM {BCAT_CONFIG[table]['table']} AS t
        
    """

    # quote string parameters
    params.update({k: f"'{v}'" for k, v in params.items() if BCAT_CONFIG[table]['params'][k] == str})

    for i, (k, v) in enumerate(params.items()):
        if not i:
            query += f'WHERE {k} = {v}'
        else:
            query += f'AND {k} = {v}'

    cur.execute(query)
    results = cur.fetchone()

    return results[0]


@app.get("/tiles/<table>/<z>/<x>/<y>.pbf")
def get_tile(table, z, x, y):
    logger.info(os.environ)

    if table not in TILES_CONFIG:
        raise BadRequestError(f'{table} not a valid table')

    conn = psycopg.connect(
        user=os.environ['DB_USER'],
        password=os.environ['SECRET'],
        host=os.environ['DB_HOST'],
        dbname=os.environ['DB_NAME']
    )

    # create a cursor
    cur = conn.cursor()

    query = f"""
        SELECT ST_AsMVT(q, '{table}', 4096, 'geom')
        
        FROM (
            SELECT {TILES_CONFIG[table]['columns']},
            ST_AsMvtGeom(
                st_transform({TILES_CONFIG[table]['geometry']}, 3857),
                BBox({x}, {y}, {z}, 3857, 0),
                4096,
                256
                ) AS geom
            FROM {TILES_CONFIG[table]['table']}
            WHERE {TILES_CONFIG[table]['geometry']} && BBox({x}, {y}, {z}, 4326, 0)
            AND st_intersects({TILES_CONFIG[table]['geometry']}, BBox({x}, {y}, {z}, 4326, 0))
            ) AS q;
        """

    cur.execute(query)
    results = cur.fetchone()

    # need to configure something to allow returning binary data response
    # return results[0]
    return {'r': str(results[0])}


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)