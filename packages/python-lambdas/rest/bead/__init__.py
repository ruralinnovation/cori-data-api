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


def get_bead_geojson():
    table = "bead_bl"

    print(f'requesting bead layer geojson from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    geoid = CONFIG[table].get('geoid', None)
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
    order_by = ', '.join([x for x in params if x != 'geom'])
    simplify = CONFIG[table].get('simplify', 0.0)

    columns += ", 'geojson' as type"

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id, {id},')
        id_in_result = "'id',         x_id,"
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    if geom:
        columns = columns.replace(f'{geom},',
                                  f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
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

    return features


"""
Query:
SELECT geoid_bl, new_alias, isp_id, technology, max_down, max_up, 'isp_tech' as type
    FROM proj_bead.isp_tech_geoid_bl
    WHERE geoid_bl = ANY('{010539698023012}')
    ORDER BY geoid_bl
    LIMIT 500
    OFFSET 0;
"""


def get_bead_isp_tech():
    table = "isp_tech_bl"

    print(f'requesting bead isp tech from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    geoid = CONFIG[table].get('geoid', None)
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    order_by = f'{geoid}'
    params = CONFIG[table]['params']

    columns += ", 'isp_tech' as type"

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

    return features


"""
Query:
SELECT award_bl.award_geoid_bl, rdof.*, 'award' as type
	FROM (
		SELECT geoid_bl, award_geoid_bl
			FROM proj_bead.award_bl
			WHERE geoid_bl = ANY('{010539698023012}') --  == 010539698003009
	) award_bl, proj_bead.rdof_bl rdof
	WHERE award_bl.award_geoid_bl = rdof.geoid_bl
	ORDER BY geoid_bl
	LIMIT 500
	OFFSET 0;
"""


def get_bead_award_rdof():
    table = "rdof_bl"

    print(f'requesting bead previous rdof award status from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    db_table = CONFIG[table].get('table', table)
    db_alias = CONFIG[table].get('alias', table)
    columns = CONFIG[table].get('api_columns', '*')
    geoid = CONFIG[table].get('geoid', None)
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    order_by = f'{db_alias}.{geoid}'
    params = CONFIG[table]['params']

    columns += ", 'award' as type"

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
                    FROM (
                        SELECT geoid_bl, award_geoid_bl
                            FROM proj_bead.award_bl
                            {where}
                    ) award_bl, {db_table} {db_alias}
                    WHERE award_bl.award_geoid_bl = rdof.geoid_bl
                    ORDER BY {order_by}
                    LIMIT {limit}
                    OFFSET {offset}
                ) t

        """

    print(query)

    # execute the query string.
    features = execute(query)

    return features


def get_bead_detailed_info(tab):
    table = f'{tab}_bl'

    print(f'requesting bead detailed info from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    match tab:
        case "geojson":
            # Try to get just tech
            features = get_bead_geojson()

        case "isp_tech":
            # Try to get just tech
            features = get_bead_isp_tech()

        case "rdof":
            features = get_bead_award_rdof()

        case _:
            geojson_features = get_bead_geojson()
            isp_features = get_bead_isp_tech()
            rdof_features = get_bead_award_rdof()
            features = geojson_features + isp_features + rdof_features

    # print(features)

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
