import os
import types
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

from acs_config import CONFIG
from acs_connection import execute

logger = Logger(service="ACSService")
tracer = Tracer(service="ACSService")
app = APIGatewayRestResolver(strip_prefixes=["/acs"])


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


"""
acs tables
"""
@app.get("/<table>", compress=False)
def get_acs(table):
    """
    construct and execute a query to <table> with where clause based on <params>
    """
    print(f'testing acs endpoint /testing/{table} on system:')
    print(os.environ)

    logger.info(os.environ)

    # check that the table, parameters, and filter values are all acceptable.
    #   - allowed tables are top level keys in CONFIG.
    #   - allowed params are listed in CONFIG[table]["params"]
    #   - no semicolons to prevent some sql injection style attacks though those wouldnt work anyway because the
    #       filter values are constructed as text array literals and cant ever be executed.
    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    # get some short names of parameters used to construct the query
    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    params = CONFIG[table]['params']
    simplify = CONFIG[table].get('simplify', 0.0)
    id = CONFIG[table].get('id', None)
    order_by = "year, acs_code"
#     if (columns != "*"):
#         order_by = columns

    # criteria is a list of where clauses for the query.
    criteria = []

    if app.current_event.query_string_parameters:
        print("URL query params is not empty")
        print(type(app.current_event.query_string_parameters.keys))
        print(types.BuiltinFunctionType)
        if (type(app.current_event.query_string_parameters.keys) == types.BuiltinFunctionType):
            print("type(app.current_event.query_string_parameters.keys) == types.FunctionType")
            invalid_params = [k for k in app.current_event.query_string_parameters.keys() if k not in params]
            if invalid_params:
                raise BadRequestError(f'invalid parameter {invalid_params}')

            params = app.current_event.query_string_parameters

            print(f'with params:')
            print(params)

            logger.info(params)

            if ';' in str(params):
                raise BadRequestError(f'invalid parameter')

            # first handle a potential spatial intersection then remove this parameter and construct the rest.
            if 'geom' in params:

                criteria += [f"""
                    st_intersects({geom}, st_transform(st_geomfromtext('{params['geom']}', {webmercator_srid}), {epsg}))
                    """]

                del params['geom']

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            params.update({k: [v, ] for k, v in params.items() if type(v) != list})
            params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in params.items()})
            for k, v in params.items():
                criteria += [f'{k} = {v}', ]
    else:
        print("URL query params is empty")

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id,')
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

    # option to limit the total number of records returned. dont include this key in the config to disable
    limit = ''
    if 'limit' in CONFIG[table]:
        limit = f"LIMIT {CONFIG[table]['limit']}"

    # join the criteria so that we get the right syntax for any number of clauses
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
                        ORDER BY geoid_co, {order_by}
                        {limit}
                    ) t

            """
    else:
        query = f"""
            SELECT
                json_build_object(
                    'type',       'Feature',
                    'geometry',   ST_AsGeoJSON(geom)::jsonb,
                    'properties', to_jsonb(t.*) - 'geom'
                )
                FROM (
                    SELECT DISTINCT {order_by}, variable, ST_GeomFromText('POLYGON EMPTY') as geom
                        FROM {db_table}
                        ORDER BY {order_by}
                    ) t
        """

    print(query)

    # execute the query string.
    features = execute(query)

    result = {
        'type': 'FeatureCollection',
        'features': [f[0] for f in features],
        }

    return result


"""
acs testing endpoints
"""
# @app.get("/testing")
# def get():
#     print("testing acs endpoint /testing")
#
#     logger.info("testing acs endpoint /testing on system:")
#     logger.info(os.environ)
#
#     return {
#         "message": "success"
#     }
#

# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)
