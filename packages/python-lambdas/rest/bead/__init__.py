from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from flask import jsonify, request, Response
import json
import types

from .bead_config import CONFIG
from .bead_connection import execute, execute_with_cols

LIMIT = 500
OFFSET = 0
PAGE = 0

logger = Logger(service="BEAD")
tracer = Tracer(service="BEAD")

global_params = CONFIG['global']['params']


def get_bead_isp_tech(tab):
    table = f'isp_tech_geoid_{tab}'

    print(f'requesting bead isp tech from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'{geoid}'
    params = CONFIG[table]['params']

    # if no id then use somewhat hacky ctid to bigint method.
    # WARNING: only works if there are no changes to table rows!!
    columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    print(columns)

    # criteria is a list of where clauses for the query.
    criteria = []

    if type(request.args.keys) is types.BuiltinFunctionType and len(request.args.keys()) > 0:
        print("URL query params is not empty")
        invalid_params = [k for k in request.args.keys() if k not in (global_params + params)]
        if invalid_params:
            raise BadRequestError(f'invalid parameter {invalid_params}')

        query_params = {k: [v, ] for k, v in request.args.items()}

        logger.info(query_params)
        print(query_params)

        # Get list of available vars for this geoid
        if f'{geoid}' not in query_params.keys():
            raise BadRequestError(f'missing {geoid}')
        elif ';' in str(query_params):
            raise BadRequestError(f'invalid parameter')

        print(f'geoid is {geoid}: {query_params[geoid]}')

        for k, v in query_params.items():
            print(f'{k} = {v}')

            if 'limit' in query_params and k == 'limit':
                limit = int(v[0])
                # del query_params['limit']

            if 'offset' in query_params and k == 'offset':
                offset = int(v[0])
                # del query_params['offset']

            if 'page' in query_params and k == 'page':
                page = int(v[0])
                # del query_params['page']

                if page > 0:
                    offset = page * limit

        if 'limit' in query_params:
            del query_params['limit']

        if 'offset' in query_params:
            del query_params['offset']

        if 'page' in query_params:
            del query_params['page']

        # since we want to handle one or more parameter values coerce all to list
        # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
        query_params.update({k: [v, ] for k, v in query_params.items() if type(v) != list})
        query_params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in query_params.items()})
        for k, v in query_params.items():
            criteria += [f'{k} = {v}', ]

    else:
        print("URL query params is empty")

    print('criteria:')
    print(criteria)

    # join the criteria so that we get the right syntax for any number of clauses
    where = ''
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    # build the query statement
    query = f"""
        SELECT
            json_build_object(
                'type',       'Feature',
                'properties', to_jsonb(t.*) - 'x_id'
            )
            FROM (
                SELECT {columns}
                    FROM {db_table}
                    {where}
                    ORDER BY {order_by}
                    LIMIT {limit}
                    OFFSET {offset}
                ) t

        """

    print(query)

    # execute the query string.
    features = execute(query)

    result = {
        "type": "FeatureCollection",
        "features": [f[0] for f in features]
    }

    return Response(
        response=json.dumps(result, indent=None),
        status=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
        }
    )
