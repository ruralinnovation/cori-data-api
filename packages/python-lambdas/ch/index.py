import os
import json
import types
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

from ch_config import CONFIG
from ch_connection import execute
from ch_connection import execute_with_cols

LIMIT = 100 # Texas has 254 counties... https://simple.wikipedia.org/wiki/List_of_counties_in_Texas
OFFSET = 0
PAGE = 0

logger = Logger(service="ConnectHumanityService")
tracer = Tracer(service="ConnectHumanityService")
app = APIGatewayRestResolver(strip_prefixes=["/ch"])
global_params = CONFIG['global']['params']

@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


"""
ch testing
"""
@app.get("/testing")
def get():
    print("testing ch endpoint /testing")

    logger.info("testing ch endpoint /testing on system:")
    logger.info(os.environ)

    return {
        "message": "success"
    }


def get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify, webmercator_srid, where, order_by, limit, offset):
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


"""
ch variables
"""
@app.get("/<tab>/vars", compress=False)
def list_ch_vars(tab):

    table = f'ch_app_var_xwalk_{tab}'

    """
    List available variables in <table> with where clause based on <params>
    """
    print(f'List available variables in {table} for <params>:')
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
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'variable'
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

            query_params = app.current_event.query_string_parameters

            print(f'with query_params:')
            print(query_params)

            logger.info(query_params)

            if ';' in str(query_params):
                raise BadRequestError(f'invalid parameter')

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            conditional_values.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in conditional_values.items()})
            for k, v in conditional_values.items():
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
    vars = execute_with_cols(query)

    result = {
        'type': 'Variables',
        'variables': [ v for dict in vars for k, v in dict.items() ]
        }


    return result


"""
ch values
"""
@app.get("/<tab>", compress=False)
def get_ch_values(tab):

    table = f'ch_app_wide_{tab}'

    """
    Get values in <table> with where clause based on variables in <params>
    """
    print(f'Get values in {table} for <params>:')
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
    db_table = CONFIG[table].get('table', table)
    columns = CONFIG[table].get('api_columns', '*')
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'{geoid}'
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

            query_params = app.current_event.query_string_parameters

            print('with query_params:')
            print(query_params)

            logger.info(query_params)

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
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            conditional_values.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in conditional_values.items()})
            for k, v in conditional_values.items():
                criteria += [f'{k} = {v}', ]
    else:
        print("URL query_params is empty")

    # join the criteria so that we get the right syntax for any number of clauses
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
        SELECT '{query_params[geoid]}' as {geoid}, cw.*, v.value
            FROM sch_proj_climate.ch_app_crosswalk cw
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
        status_code=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
            },
        body=json.dumps(result, indent=None)
        )


"""
ch geo (FeatureCollection)
"""
@app.get("/<tab>/geo", compress=False)
def get_ch_geo(tab):

    table = f'ch_app_wide_{tab}'

    if table not in CONFIG:
        raise BadRequestError(f'invalid table {table}')

    # get some short names of parameters used to construct the query
    webmercator_srid = 4326
    attr_table = CONFIG[table]['table']
    geom_table = CONFIG[f'{table}_geo']['table']
#     columns = CONFIG[table].get('api_columns', '*')
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[f'{table}_geo'].get('geom', None)
    epsg = CONFIG[f'{table}_geo'].get('epsg', None)
    # option to limit the total number of records returned. dont include this key in the CONFIG to disable
    limit = LIMIT
    if 'limit' in CONFIG[table]:
        limit = f"{CONFIG[table]['limit']}"
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'{geoid}'
#     if (columns != "*"):
#         order_by = columns
    simplify = CONFIG[f'{table}_geo'].get('simplify', 0.0)

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

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

            query_params = app.current_event.query_string_parameters

            print('with query_params:')
            print(query_params)

            logger.info(query_params)

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

            # Add namelsad to list of variables
            variables.insert(0, 'namelsad as name')

            # Add geoid label ('geoid_co' | 'geoid_tr') to list of variables
            variables.insert(0, f'{tab}.{geoid}')

            query_fields = ", ".join(variables)

            print(f'with query_fields: {query_fields}')

            if ';' in str(query_params):
                raise BadRequestError(f'invalid parameter')

            # handle a potential spatial intersection then remove this parameter and construct the rest.
            if 'geom' in query_params:

                criteria += [f"""
                    st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                    """]

                del query_params['geom']

            if 'limit' in query_params:

                limit = int(query_params['limit'])

                del query_params['limit']

            if 'offset' in query_params:

                offset = int(query_params['offset'])

                del query_params['offset']

            if 'page' in query_params:

                page = int(query_params['page'])

                if page > 0:
                    offset = page * limit

                del query_params['page']

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            conditional_values.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in conditional_values.items()})
            for k, v in conditional_values.items():
                if k == geoid:
                    criteria += [f'{tab}.{geoid} = {v}', ]
                else:
                    criteria += [f'{k} = {v}', ]

    else:
        print("URL query params is empty")

    # join the criteria so that we get the right syntax for any number of clauses
    where = ''
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    result = get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify, webmercator_srid, where, order_by, limit, offset)

    return Response(
        status_code=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
            },
        body=json.dumps(result, indent=None)
        )


"""
ch neighboring geos (same state/county)
"""
@app.get("/<tab>/overall_neighbor_geos", compress=False)
def get_ch_overall_neighbor_geo(tab):

    table = f'ch_app_wide_{tab}'

    # get some short names of parameters used to construct the query
    webmercator_srid = 4326
    attr_table = CONFIG[table]['table']
    geom_table = CONFIG[f'{table}_geo']['table']
    #     columns = CONFIG[table].get('api_columns', '*')
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[f'{table}_geo'].get('geom', None)
    epsg = CONFIG[f'{table}_geo'].get('epsg', None)
    # option to limit the total number of records returned. dont include this key in the CONFIG to disable
    limit = LIMIT
    if 'limit' in CONFIG[f'{table}_geo']:
        limit = f"{CONFIG[f'{table}_geo']['limit']}"
    offset = OFFSET
    page = PAGE
    params = CONFIG[f'{table}_geo']['params']
    id = CONFIG[f'{table}_geo'].get('id', None)
    geoid = CONFIG[f'{table}_geo'].get('geoid', None)
    order_by = f'{geoid}'
    #     if (columns != "*"):
    #         order_by = columns
    simplify = CONFIG[f'{table}_geo'].get('simplify', 0.0001)

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

    if app.current_event.query_string_parameters:
        print("URL query params is not empty")
        print(type(app.current_event.query_string_parameters.keys))
        print(types.BuiltinFunctionType)
        if (type(app.current_event.query_string_parameters.keys) == types.BuiltinFunctionType):
            print("type(app.current_event.query_string_parameters.keys) == types.FunctionType")
            invalid_params = [k for k in app.current_event.query_string_parameters.keys() if k not in params]
            if invalid_params:
                raise BadRequestError(f'invalid parameter {invalid_params}')

            query_params = app.current_event.query_string_parameters

            print('with query_params:')
            print(query_params)

            logger.info(query_params)

            # Get list of available vars for this geoid
            if f'{geoid}' not in query_params.keys():
                raise BadRequestError(f'missing {geoid}')
            else:
                variables = [ "overall_loss_score", "overall_loss_rating", "pct_bb_25_3", "pct_bb_100_20", "pct_bb_fiber" ]
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

            # handle a potential spatial intersection then remove this parameter and construct the rest.
            if 'geom' in query_params:

                criteria += [f"""
                    st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                    """]

                del query_params['geom']

            if 'limit' in query_params:

                limit = int(query_params['limit'])

                del query_params['limit']

            if 'offset' in query_params:

                offset = int(query_params['offset'])

                del query_params['offset']

            if 'page' in query_params:

                page = int(query_params['page'])

                if page > 0:
                    offset = page * limit

                del query_params['page']

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            for k, v in conditional_values.items():
                if k == geoid:
#                     print(v[0])
#                     print(type(v[0]))
                    if geoid == "geoid_co":
                        fips_st = v[0][0:2] # get state fips from first two chars of geoid
                        print(fips_st)
                        where = f'WHERE {geoid} ilike ' + "'" + fips_st + "%'"
                    elif geoid == "geoid_tr":
                        geoid_co = v[0][0:5] # get county geoid from first five chars of geoid
                        print(geoid_co)
                        where = f'WHERE {geoid} ilike ' + "'" + geoid_co + "%'"

    else:
        print("URL query params is empty")
        raise BadRequestError(f'Must provide a single {geoid}')

    # build the first query statement
    query = f"""
        SELECT {geoid}
            FROM {attr_table}
            {where}
            ORDER BY {order_by}
        """

    print(query)

    # execute the query string.
    geoids = "ANY('{" + ",".join([item for sublist in execute(query) for item in sublist]) + "}')"
    where = f'WHERE {tab}.{geoid} = {geoids}'

    result = get_ch_geojson(tab, geoid, attr_table, geom_table, query_fields, simplify, webmercator_srid, where, order_by, limit, offset)

    return Response(
        status_code=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
            },
        body=json.dumps(result, indent=None)
        )


"""
ch geo bbox at location
"""
@app.get("/<tab>/at_location", compress=False)
def get_bb_map(tab):

    table = f'ch_app_wide_{tab}_geo'

    # get some short names of parameters used to construct the query
    webmercator_srid = 4326
    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    # option to limit the total number of records returned. dont include this key in the CONFIG to disable
    limit = LIMIT
    if 'limit' in CONFIG[table]:
        limit = f"{CONFIG[table]['limit']}"
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'{geoid}'
    #     if (columns != "*"):
    #         order_by = columns
    simplify = CONFIG[table].get('simplify', 0.0001)

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

    if app.current_event.query_string_parameters:
        print("URL query params is not empty")
        print(type(app.current_event.query_string_parameters.keys))
        print(types.BuiltinFunctionType)
        if (type(app.current_event.query_string_parameters.keys) == types.BuiltinFunctionType):
            print("type(app.current_event.query_string_parameters.keys) == types.FunctionType")
            invalid_params = [k for k in app.current_event.query_string_parameters.keys() if k not in params]
            if invalid_params:
                raise BadRequestError(f'invalid parameter {invalid_params}')

            query_params = app.current_event.query_string_parameters

            print('with query_params:')
            print(query_params)

            logger.info(query_params)

            if ';' in str(query_params):
                raise BadRequestError(f'invalid parameter')

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            for k, v in conditional_values.items():
                if k == "lon":
#                     print(v[0])
#                     print(type(v[0]))
                    lon = v[0]
                if k == "lat":
#                     print(v[0])
#                     print(type(v[0]))
                    lat = v[0]

    else:
        print("URL query params is empty")
        raise BadRequestError(f'Must provide a single {geoid}')

    # build the query statement
    query = f"""
        SELECT
            json_build_object(
                'type',       'Feature',
                'properties', to_jsonb(t.*) - 'geom',
                'geometry',   ST_AsGeoJSON(geom)::jsonb
            )
            FROM (
                SELECT geoid_tr,
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

    features = execute(query)

    result = {
        "type": "FeatureCollection",
        "features": [f[0] for f in features]
        }

    return Response(
        status_code=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
            },
        body=json.dumps(result, indent=None)
        )


"""
bb map (block -> FeatureCollection)
"""
@app.get("/<tab>/bb_map", compress=False)
def get_bb_map(tab):

    table = f'bb_map_{tab}'

    # get some short names of parameters used to construct the query
    webmercator_srid = 4326
    db_table = CONFIG[table]['table']
    columns = CONFIG[table].get('api_columns', '*')
    geom = CONFIG[table].get('geom', None)
    epsg = CONFIG[table].get('epsg', None)
    # option to limit the total number of records returned. dont include this key in the CONFIG to disable
    limit = LIMIT
    if 'limit' in CONFIG[table]:
        limit = f"{CONFIG[table]['limit']}"
    offset = OFFSET
    page = PAGE
    params = CONFIG[table]['params']
    id = CONFIG[table].get('id', None)
    geoid = CONFIG[table].get('geoid', None)
    order_by = f'{geoid}'
    #     if (columns != "*"):
    #         order_by = columns
    simplify = CONFIG[table].get('simplify', 0.0001)

    # criteria is a list of where clauses for the query.
    criteria = []
    where = ''

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
    else:
        columns += ", ST_GeomFromText('POLYGON EMPTY') as geom"

    if app.current_event.query_string_parameters:
        print("URL query params is not empty")
        print(type(app.current_event.query_string_parameters.keys))
        print(types.BuiltinFunctionType)
        if (type(app.current_event.query_string_parameters.keys) == types.BuiltinFunctionType):
            print("type(app.current_event.query_string_parameters.keys) == types.FunctionType")
            invalid_params = [k for k in app.current_event.query_string_parameters.keys() if k not in params]
            if invalid_params:
                raise BadRequestError(f'invalid parameter {invalid_params}')

            query_params = app.current_event.query_string_parameters

            print('with query_params:')
            print(query_params)

            logger.info(query_params)

            # Get list of available vars for this geoid
            if f'{geoid}' not in query_params.keys():
                raise BadRequestError(f'missing {geoid}')

            print(f'geoid is {geoid}: {query_params[geoid]}')

            if ';' in str(query_params):
                raise BadRequestError(f'invalid parameter')

            # handle a potential spatial intersection then remove this parameter and construct the rest.
            if 'geom' in query_params:

                criteria += [f"""
                    st_intersects({geom}, st_transform(st_geomfromtext('{query_params['geom']}', {webmercator_srid}), {epsg}))
                    """]

                del query_params['geom']

            if 'limit' in query_params:

                limit = int(query_params['limit'])

                del query_params['limit']

            if 'offset' in query_params:

                offset = int(query_params['offset'])

                del query_params['offset']

            if 'page' in query_params:

                page = int(query_params['page'])

                if page > 0:
                    offset = page * limit

                del query_params['page']

            # since we want to handle one or more parameter values coerce all to list
            # construct "any" style array literal predicates like: where geoid = any('{123, 456}')
            conditional_values = {k: [v, ] for k, v in query_params.items() if type(v) != list}
            conditional_values.update({k: "ANY('{" + ",".join(v) + "}')" for k, v in conditional_values.items()})
            for k, v in conditional_values.items():
                criteria += [f'{k} = {v}', ]
#                 if k == geoid:
# #                     print(v[0])
# #                     print(type(v[0]))
#                     if geoid == "geoid_co":
#                         fips_st = v[0][0:2] # get state fips from first two chars of geoid
#                         print(fips_st)
#                         where = f'WHERE {geoid} ilike ' + "'" + fips_st + "%'"
#                     elif geoid == "geoid_tr":
#                         geoid_co = v[0][0:5] # get county geoid from first five chars of geoid
#                         print(geoid_co)
#                         where = f'WHERE {geoid} ilike ' + "'" + geoid_co + "%'"

    else:
        print("URL query params is empty")
        raise BadRequestError(f'Must provide a single {geoid}')

    # join the criteria so that we get the right syntax for any number of clauses
    if criteria:
        where = 'WHERE ' + ' AND '.join(criteria)

    # build the query statement
    query = f"""
        SELECT
            json_build_object(
                'type',       'Feature',
                'geometry',   ST_AsGeoJSON(geom)::jsonb,
                'properties', to_jsonb(t.*) - 'geom'
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

    blocks = execute(query)

    result = {
        "type": "FeatureCollection",
        "features": [b[0] for b in blocks]
        }

    return Response(
        status_code=200,
        content_type='application/json',
        headers={
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'access-control-allow-credentials': 'true'
            },
        body=json.dumps(result, indent=None)
        )


# @app.get("/<table>/tiles/<z>/<x>/<y>.pbf")
# def get_tile(table, z, x, y):
#     """generate mvt tiles"""
#     logger.info(os.environ)
#
#     # only tables listed in config are permitted and they must have a geometry column name configured.
#     if table not in CONFIG:
#         raise BadRequestError(f'invalid table {table}')
#
#     if 'geom' not in CONFIG[table]['params']:
#         raise BadRequestError(f'no geometry: {table}')
#
#     # define some temporary variables to make the query pattern cleaner
#     db_table = CONFIG[table]['table']
#     columns = CONFIG[table].get('tile_columns', '*')
#     geom = CONFIG[table]['geom']
#     epsg = CONFIG[table]['epsg']
#
#     # build the mvt query. you can find a similar query explained here
#     # https://www.crunchydata.com/blog/dynamic-vector-tiles-from-postgis
#     # bbox function must be created once and is defined in database_changes.sql
#     query = f"""
#         SELECT ST_AsMVT(q, '{table}', 4096, 'geom')
#
#         FROM (
#             SELECT {columns},
#             ST_AsMvtGeom(
#                 st_transform({geom}, 3857),
#                 BBox({x}, {y}, {z}, 3857, 0),
#                 4096,
#                 256
#                 ) AS geom
#             FROM {db_table}
#             WHERE {geom} && BBox({x}, {y}, {z}, {epsg}, 0)
#             AND st_intersects({geom}, BBox({x}, {y}, {z}, {epsg}, 0))
#             ) AS q;
#         """
#
#     result = execute(query)[0][0]
#
# #     return Response(status_code=200, content_type='application/x-protobuf', body=tile_data)
#     return Response(
#         status_code=200,
#         content_type='application/x-protobuf',
#         headers={
#             'access-control-allow-origin': '*',
#             'access-control-allow-headers': 'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
#             'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
#             'access-control-allow-credentials': 'true'
#             },
#         body=result
#         )


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)

