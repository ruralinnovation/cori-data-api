# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
# from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from flask import jsonify, request, Response
import json
import types

from .ch_config import CONFIG
from .ch_connection import execute, execute_with_cols

LIMIT = 500
OFFSET = 0
PAGE = 0

logger = Logger(service="BCAT")
tracer = Tracer(service="BCAT")
# app = APIGatewayRestResolver(strip_prefixes=["/bcat"])
global_params = CONFIG['global']['params']


def list_ch_vars(tab):
    table = f'ch_app_var_xwalk_{tab}'

    print(f'List available variables in {table} for <params>:')

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    # get some short names of parameters used to construct the query
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    params = CONFIG[table]['params']
    order_by = f'variable'

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

        # since we want to handle one or more parameter values coerce all to list
        # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
        query_params.update({k: [v, ] for k, v in query_params.items() if type(v) != list})
        query_params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in query_params.items()})
        for k, v in query_params.items():
            criteria += [f'{k} = {v}', ]

    else:
        print("URL query_params is empty")

    if id:
        columns = columns.replace(f'{id},', f'"{id}" as x_id,')
    else:
        # if no id then use somewhat hacky ctid to bigint method.
        # WARNING: only works if there are no changes to table rows!!
        columns += ", ((ctid::text::point)[0]::bigint<<32 | (ctid::text::point)[1]::bigint) as x_id"

    # join the criteria so that we get the right syntax for any number of clauses
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)
        # build the query statement
        query = f"""
            SELECT variable
                FROM (
                    SELECT {columns}
                        FROM {db_table}
                        {where}
                        ORDER BY {order_by}
                    ) t

            """
    else:
        query = f"""
            SELECT variable
                FROM (
                    SELECT DISTINCT {order_by}
                        FROM {db_table}
                        ORDER BY {order_by}
                    ) t
        """

    print(query)

    # execute the query string.
    ch_vars = execute_with_cols(query)

    result = {
        'type': 'Variables',
        'variables': [v for vars_dict in ch_vars for k, v in vars_dict.items()]
    }

    return result


def get_ch_vars(tab):

    return Response(
        response=json.dumps(list_ch_vars(tab), indent=None),
        status=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
        }
    )


def get_ch_values(tab):

    table = f'ch_app_wide_{tab}'

    print(f'requesting ch values from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    attr_table = CONFIG[table]['table']
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    geoid = CONFIG[table].get('geoid', None)
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    geom_table = CONFIG[f'{table}_geo']['table']
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    order_by = f'{geoid}'
    params = CONFIG[table]['params']

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
        else:
            for k, v in list_ch_vars(tab).items():
                # print(f'{k}')
                if k == 'variables':
                    variables = v
                    for var in variables:
                        print(var)

        print(f'geoid is {geoid}: {query_params[geoid]}')

        # Add geoid label ('geoid_co' | 'geoid_tr') to list of variables
        variables.insert(0, geoid)

        query_fields = ", ".join(variables)

        print(f'with query_fields: {query_fields}')

        if ';' in str(query_params):
            raise BadRequestError(f'invalid parameter')

        # since we want to handle one or more parameter values coerce all to list
        # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
        for k, v in query_params.items():
            # capture geoid literal value
            if k == geoid:
                geoid_value = f'{v[0]}'
        query_params.update({k: [v, ] for k, v in query_params.items() if type(v) != list})
        query_params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in query_params.items()})
        for k, v in query_params.items():
            # if k == geoid:
            #     criteria += [f'{tab}.{geoid} = {v}', ]
            # else:
                criteria += [f'{k} = {v}', ]

    else:
        print("URL query params is empty")

    print('criteria:')
    print(criteria)

    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)
        # build the query statement
        query = f"""
            SELECT {query_fields}
                FROM {db_table}
                {where}
                ORDER BY {order_by}
            """
    else:
        query = f"""
            SELECT {query_fields}
                FROM {db_table}
                ORDER BY {order_by}
        """

    print(query)

    # execute the query string.
    values = execute_with_cols(query)
    values = [ v for dict in values for k, v in dict.items() ]

    query_values = []

    for i in range(1, len(variables)): # skip geoid when looping through variables/values
        variable = variables[i]
        value = values[i]
        value_literal = f"""
                              ('{variable}', {value})"""
        query_values.append(value_literal)

    query = f"""
        SELECT '{geoid_value}' as {geoid}, cw.*, v.value
            FROM proj_climate.ch_app_crosswalk cw
                INNER JOIN (
                    SELECT *
                        FROM (VALUES
                              {",".join(query_values)}
                             ) as v ("variable",  "value")
                ) v
                ON cw.name = v.variable
    """

    print(query)

    # execute the query string.
    values_with_attributes = execute_with_cols(query)

    #     for dict in values_with_attributes:
    #         for k, v in dict.items():
    #             print(f'{k}: {v} ({type(v)})')

    result = {
        'type': 'Values',
        'values': values_with_attributes
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


def get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify,
                   webmercator_srid, where, order_by, limit, offset):
    # build the query statement
    query = f"""
        SELECT
            json_build_object(
                'type',       'Feature',
                'properties', to_jsonb(t.*) - 'geom',
                'geometry',   ST_AsGeoJSON(geom)::jsonb
            )
            FROM (
                SELECT {query_fields}, st_simplify(st_transform(geom, {webmercator_srid}), {simplify}) as geom
                    FROM {attr_table} {tab}
                        INNER JOIN (
                            SELECT {geoid}, namelsad, geom
                                FROM {geom_table}
                        ) geo1 ON {tab}.{geoid} = geo1.{geoid}
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

    return result


def get_ch_geo(tab):
    table = f'ch_app_wide_{tab}'

    print(f'requesting ch geos from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    attr_table = CONFIG[table]['table']
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    geoid = CONFIG[table].get('geoid', None)
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    geom_table = CONFIG[f'{table}_geo']['table']
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    order_by = f'{geoid}'
    params = CONFIG[table]['params']
    simplify = CONFIG[table].get('simplify', 0.0001)

    if id:
        columns = columns.replace(f'{id},', f'{id}, "{id}" as x_id,')
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

        # Get list of available vars for this geoid
        if f'{geoid}' not in query_params.keys():
            raise BadRequestError(f'missing {geoid}')
        else:
            # variables = [ "overall_loss_score", "overall_loss_rating", "pct_bb_25_3", "pct_bb_100_20", "pct_bb_fiber" ]
            for k, v in list_ch_vars(tab).items():
                # print(f'{k}')
                if k == 'variables':
                    variables = v
                    for var in variables:
                        print(var)

        print(f'geoid is {geoid}: {query_params[geoid]}')

        # Add namelsad to list of variables
        variables.insert(0, 'namelsad as name')

        # Add geoid label ('geoid_co' | 'geoid_tr') to list of variables
        variables.insert(0, f'{tab}.{geoid}')

        query_fields = ", ".join(variables)

        print(f'with query_fields: {query_fields}')

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
            if k == geoid:
                criteria += [f'{tab}.{geoid} = {v}', ]
            else:
                criteria += [f'{k} = {v}', ]

    else:
        print("URL query params is empty")

    print('criteria:')
    print(criteria)

    # join the criteria so that we get the right syntax for any number of clauses
    where = ''
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    # execute the query string.
    result = get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify, webmercator_srid, where,
                            order_by, limit, offset)

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


def get_ch_overall_neighbor_geos(tab):
    table = f'ch_app_wide_{tab}'

    print(f'requesting ch neighboring geos from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    attr_table = CONFIG[table]['table']
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    id_in_result = ""
    geoid = CONFIG[table].get('geoid', None)
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    geom_table = CONFIG[f'{table}_geo']['table']
    limit = ''  # Option to limit the total number of records returned. Don't include this key in the config to disable
    if 'limit' in CONFIG[table]:
        limit = CONFIG[table].get('limit', LIMIT)
    else:
        limit = LIMIT
    offset = OFFSET
    page = PAGE
    order_by = f'{geoid}'
    params = CONFIG[table]['params']
    simplify = CONFIG[table].get('simplify', 0.0001)

    if id:
        columns = columns.replace(f'{id},', f'{id}, "{id}" as x_id,')
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

        # Get list of available vars for this geoid
        if f'{geoid}' not in query_params.keys():
            raise BadRequestError(f'missing {geoid}')
        else:
            variables = ["overall_loss_score", "overall_loss_rating", "pct_bb_25_3", "pct_bb_100_20", "pct_bb_fiber"]
            for var in variables:
                print(var)

        print(f'geoid is {geoid}: {query_params[geoid]}')

        # Add namelsad to list of variables
        variables.insert(0, 'namelsad as name')

        # Add geoid label ('geoid_co' | 'geoid_tr') to list of variables
        variables.insert(0, f'{tab}.{geoid}')

        query_fields = ", ".join(variables)

        print(f'with query_fields: {query_fields}')

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
        # query_params.update({k: [v, ] for k, v in query_params.items() if type(v) != list})
        # query_params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in query_params.items()})
        for k, v in query_params.items():
            # criteria += [f'{k} = {v}', ]
            if k == geoid:
                print(v[0])
                print(type(v[0]))
                if geoid == "geoid_co":
                    fips_st = v[0][0:2]  # get state fips from first two chars of geoid
                    print(fips_st)
                    where = f'WHERE {geoid} ilike ' + "'" + fips_st + "%'"
                elif geoid == "geoid_tr":
                    geoid_co = v[0][0:5]  # get county geoid from first five chars of geoid
                    print(geoid_co)
                    where = f'WHERE {geoid} ilike ' + "'" + geoid_co + "%'"

    else:
        print("URL query params is empty")

    print('criteria:')
    print(criteria)

    # build the first query statement
    query = f"""
        SELECT {geoid}
            FROM {attr_table}
            {where}
            ORDER BY {order_by}
        """

    print(query)

    geoids = "ANY('{" + ",".join([item for sublist in execute(query) for item in sublist]) + "}')"
    where = f'WHERE {tab}.{geoid} = {geoids}'

    # execute the query string.
    result = get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify, webmercator_srid, where,
                            order_by, limit, offset)

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


def get_bbox_at_location(tab):
    table = f'ch_app_wide_{tab}_geo'

    print(f'requesting ch geo bbox at location from {table}')

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
    order_by = f'{geoid}'
    params = CONFIG[table]['params']
    simplify = CONFIG[table].get('simplify', 0.0001)

    if id:
        columns = columns.replace(f'{id},', f'{id}, "{id}" as x_id,')
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

        # # Get list of available vars for this geoid
        # if f'{geoid}' not in query_params.keys():
        #     raise BadRequestError(f'missing {geoid}')
        # else:
        #     variables = [ "overall_loss_score", "overall_loss_rating", "pct_bb_25_3", "pct_bb_100_20", "pct_bb_fiber" ]
        #     for var in variables:
        #         print(var)
        #
        # print(f'geoid is {geoid}: {query_params[geoid]}')
        #
        # # Add namelsad to list of variables
        # variables.insert(0, 'namelsad as name')
        #
        # # Add geoid label ('geoid_co' | 'geoid_tr') to list of variables
        # variables.insert(0, f'{tab}.{geoid}')
        #
        # query_fields = ", ".join(variables)
        #
        # print(f'with query_fields: {query_fields}')

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
        # query_params.update({k: [v, ] for k, v in query_params.items() if type(v) != list})
        # query_params.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in query_params.items()})
        for k, v in query_params.items():
            criteria += [f'{k} = {v}', ]
            if k == "lon":
                print(v[0])
                print(type(v[0]))
                lon = v[0]
            if k == "lat":
                print(v[0])
                print(type(v[0]))
                lat = v[0]

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
                'properties', to_jsonb(t.*) - 'x_id' - 'geom',
                'geometry',   ST_AsGeoJSON(geom)::jsonb
            )
            FROM (
                SELECT {geoid},
                    namelsad,
                    st_astext(st_simplify(st_transform(st_envelope(geom), 4326), 0.0)) as bbox,
                    st_simplify(st_transform(st_envelope(geom), 4326), 0.0) as geom
                    FROM
                      {db_table}
                    WHERE ST_Contains(st_transform(geom, 4326), st_transform(st_geomfromtext('POINT({lon} {lat})', 4326), 4326))
                    LIMIT 1
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


def get_bb_map(tab):
    table = f'ch_bb_map_{tab}'

    print(f'requesting ch bb map from {table}')

    print(request.args)

    # print(types.BuiltinFunctionType)

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    webmercator_srid = 4326
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    id = CONFIG[table].get('id', None)
    id_in_result = ""
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
    simplify = CONFIG[table].get('simplify', 0.0001)

    if id:
        columns = columns.replace(f'{id},', f'{id}, "{id}" as x_id,')
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
