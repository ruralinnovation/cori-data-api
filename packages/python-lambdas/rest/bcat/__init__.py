# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
# from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from flask import jsonify, request, Response
import json
import types

from .bcat_config import CONFIG
from .bcat_connection import execute

LIMIT = 500
OFFSET = 0
PAGE = 0

logger = Logger(service="BCAT")
tracer = Tracer(service="BCAT")
# app = APIGatewayRestResolver(strip_prefixes=["/bcat"])
global_params = CONFIG['global']['params']


def get_bcat_count(table):

    print(f'requesting bcat table count from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    # check that the table, parameters, and filter values are all acceptable.
    #   - allowed tables are top level keys in CONFIG.
    #   - allowed params are listed in CONFIG[table]["params"]
    #   - no semicolons to prevent some sql injection style attacks though those wouldn't work anyway because the
    #       filter values are constructed as text array literals and cant ever be executed.
    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    order_by = ', '.join([x for x in params if x != 'geom'])
    simplify = CONFIG[table].get('simplify', 0.0)

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

        if ';' in str(query_params):
            raise BadRequestError(f'invalid parameter')

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

        if 'geom' in query_params:
            criteria += [f"""
                    st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                    """]
            del query_params['geom']

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

    # return {
    #     "message": "success"
    # }

    print('criteria:')
    print(criteria)

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

    # join the criteria so that we get the right syntax for any number of clauses
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)
        # build the query statement
        query = f"""
                    SELECT COUNT(*)
                        FROM (
                            SELECT {columns}
                                FROM {db_table}
                                {where}
                                ORDER BY {order_by}
                            ) t
            
                    """
    else:
        query = f"""
                    SELECT COUNT(*)
                        FROM (
                            SELECT DISTINCT {order_by}
                                FROM {db_table}
                                ORDER BY {order_by}
                            ) t
                """

    print(query)
    # execute the query string.
    features = execute(query)

    result = {
        "type": "Count",
        "count": features[0][0],
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


def get_bcat_props(table):

    print(f'requesting bcat layer properties from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    order_by = ', '.join([x for x in params if x != 'geom'])
    simplify = CONFIG[table].get('simplify', 0.0)

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id, {id},')
        id_in_result = "'id',         x_id,"
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    if geom:
        columns = columns.replace(f', {geom}', "")

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

        if ';' in str(query_params):
            raise BadRequestError(f'invalid parameter')

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

        # handle a potential spatial intersection then remove this parameter and construct the rest.
        if 'geom' in query_params:

            criteria += [f"""
                st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                """]

            del query_params['geom']

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
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)
        # build the query statement
        if limit == 0:
            query = f"""
                SELECT
                    json_build_object(
                        'id',         t.{id},
                        'type',       'Feature',
                        'properties', to_jsonb(t.*)
                    )
                    FROM (
                        SELECT DISTINCT {order_by}
                            FROM {db_table}
                            {where}
                            ORDER BY {order_by}
                            LIMIT 10000
                        ) t
                """
        else:
            query = f"""
                SELECT
                    json_build_object(
                        {id_in_result}
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
    elif limit == 0:
        query = f"""
            SELECT
                json_build_object(
                    'id',         t.{id},
                    'type',       'Feature',
                    'properties', to_jsonb(t.*)
                )
                FROM (
                    SELECT DISTINCT {order_by}
                        FROM {db_table}
                        ORDER BY {order_by}
                        LIMIT 10000
                    ) t
        """
    else:
        query = f"""
            SELECT
                json_build_object(
                    {id_in_result}
                    'type',       'Feature',
                    'properties', to_jsonb(t.*) - 'x_id'
                )
                FROM (
                    SELECT {columns}
                        FROM {db_table}
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
        "features": [f[0] for f in features],
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


def get_bcat_geojson(table):

    print(f'requesting bcat layer geojson from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    order_by = ', '.join([x for x in params if x != 'geom'])
    simplify = CONFIG[table].get('simplify', 0.0)

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id, {id},')
        id_in_result = "'id',         x_id,"
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

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

        if ';' in str(query_params):
            raise BadRequestError(f'invalid parameter')

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

        # handle a potential spatial intersection then remove this parameter and construct the rest.
        if 'geom' in query_params:

            criteria += [f"""
                st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                """]

            del query_params['geom']

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
                {id_in_result}
                'type',       'Feature',
                'properties', to_jsonb(t.*) - 'x_id' - 'geom',
                'geometry',   ST_AsGeoJSON(geom)::jsonb
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

