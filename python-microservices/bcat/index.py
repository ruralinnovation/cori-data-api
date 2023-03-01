import os
import types
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


"""
bcat layer feature count
"""
@app.get("/<table>/count", compress=False)
def get_bcat_count(table):
    """
    construct and execute a query to <table> with where clause based on <params>
    """
    print(f'testing bcat layer properties endpoint /{table} on system:')
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
    order_by = "geoid_co, name_co, geoid_st, state_abbr, state_name"
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
            SELECT COUNT(*)
                FROM (
                    SELECT {columns}
                        FROM {db_table}
                        {where}
                        ORDER BY {order_by}
                        {limit}
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
    count = execute(query)

    result = {
        'type': 'FeatureCount',
        'count': count
        }

    return result


"""
bcat layer properties
"""
@app.get("/<table>", compress=False)
def get_bcat_props(table):
    """
    construct and execute a query to <table> with where clause based on <params>
    """
    print(f'testing bcat layer properties endpoint /{table} on system:')
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
    order_by = "geoid_co, name_co, geoid_st, state_abbr, state_name"
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
                        ORDER BY {order_by}
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
                    SELECT DISTINCT {order_by}, ST_GeomFromText('POLYGON EMPTY') as geom
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


# @app.get("/county_summary/geojson", compress=False)
# def get_bcat_county_summary_by_page() # Query params page[, limit, offset]
# # SQL query will have to sort by county id

@app.get("/<table>/geojson", compress=False)
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
    webmercator_srid = 4326
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
        # TODO: To MF => What does this ^ mean?

    if geom:
        columns = columns.replace(f'{geom},', f'st_simplify(st_transform({geom}, {webmercator_srid}), {simplify}) as geom, ')
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
            st_intersects({geom}, st_transform(st_geomfromtext('{params['geom']}', {webmercator_srid}), {epsg}))
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

    print(query)

    # execute the query string.
    features = execute(query)

    result = {
        'type': 'FeatureCollection',
        'features': [f[0] for f in features]
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


"""
bcat testing MVC layergroup spec (Carto)
Ex.
    {
            "layergroupid": [
                "...:..."
            ],
            "metadata": {
                "layers": [
                 {
                   "type": "mapnik",
                   "id": "layer0",
                   "meta": {
                     "cartocss": ":layer { polygon-fill: :aac }",
                     "stats": {
                       "sample": [
                         {
                           "col1": "...",
                           "col2": "...",
                           "col3": ###
                         }
                       ],
                       "estimatedFeatureCount": ...,
                       "geometryType": "ST_MultiPolygon",
                       "columns": {
                         "cartodb_id": {
                           "type": "number",
                           "min": ###,
                           "max": ###,
                           "avg": ###,
                           "sum": ###
                         },
                         "...": {
                           "type": "number",
                           "min": ###,
                           "max": ###,
                           "avg": ###,
                           "sum": ###
                         },
                         "...": {
                           "type": "string",
                           "categories": [
                             {
                               "category": "...",
                               "frequency": ###
                             },
                           ]
                         },
                       },
                       "dimensions": {}
                     },
                     "dates_as_numbers": []
                   },
                   "tilejson": {
                     "vector": {
                       "tilejson": "2.2.0",
                       "tiles": [
                         "https://.../{z}/{x}/{y}.mvt?api_key=..."
                       ]
                     },
                     "raster": {
                       "tilejson": "2.2.0",
                       "tiles": [
                         "https://.../{z}/{x}/{y}.png?api_key=..."
                       ]
                     }
                   }
                 }
            ],
            "dataviews": {},
            "analyses": [],
            "tilejson": {
                "vector": {
                   "tilejson": [
                     "2.2.0"
                   ],
                   "tiles": [
                     "https://.../{z}/{x}/{y}.mvt?api_key=..."
                   ]
                 },
                 "raster": {
                   "tilejson": [
                     "2.2.0"
                   ],
                   "tiles": [
                     "https://.../{z}/{x}/{y}.png?api_key=..."
                   ]
                 }
            },
            "url": {
                "vector": {
                   "urlTemplate": [
                     "https://.../{z}/{x}/{y}.mvt?api_key=..."
                   ],
                   "subdomains": []
                 },
                 "raster": {
                   "urlTemplate": [
                     "https://.../{z}/{x}/{y}.png?api_key=..."
                   ],
                   "subdomains": []
                 }
                }
            },
            "cdn_url": {},
            "last_updated": [
                "YYYY-MM-DDTHH:MM:SS.mmmZ"
            ]
        },

"""
# @app.get("/testing", compress=False)
# def get():
#     print("testing bcat endpoint /testing")
#
#     """
#     construct and execute a query to <table> with where clause based on <params>
#     """
#     logger.info(os.environ)
#
#     # get some short names of parameters used to construct the query
#     db_table = "bcat.bcat_auction_904_subsidy_awards"
#     columns = "*"
#     # id = CONFIG[table].get('id', None)
#
#     query = f"""
#         SELECT {columns} FROM {db_table} LIMIT 1;
#
#         """
#
#     query_result = execute(query)
#
#     logger.debug(query_result)
#
#     return {
#         "layergroupid": [
#             "fc9e6770986930363e107cd17d16f72c:1639516253094"
#         ],
#         "metadata": {
#             "layers": [
#              {
#                "type": "mapnik",
#                "id": "layer0",
#                "meta": {
#                  "cartocss": ":layer { polygon-fill: :aac }",
#                  "stats": {
#                    "sample": [
#                      {
#                        "tier": "Above Baseline",
#                        "geoid_co": "06001",
#                        "name_co": "Alameda",
#                        "subsidy_recipient": "Space Exploration Technologies Corp.",
#                        "cartodb_id": 14287
#                      },
#                      {
#                        "tier": "Above Baseline",
#                        "geoid_co": "06001",
#                        "name_co": "Alameda",
#                        "subsidy_recipient": "Space Exploration Technologies Corp.",
#                        "cartodb_id": 29235
#                      }
#                    ],
#                    "estimatedFeatureCount": 193,
#                    "geometryType": "ST_MultiPolygon",
#                    "columns": {
#                      "cartodb_id": {
#                        "type": "number",
#                        "min": 102,
#                        "max": 54477,
#                        "avg": 16740.0515,
#                        "sum": 3247570
#                      },
#                      "fid": {
#                        "type": "number",
#                        "min": 524,
#                        "max": 54288,
#                        "avg": 14038.1856,
#                        "sum": 2723408
#                      },
#                      "geoid": {"type":"string","categories":[{"category":"060014001001","frequency":1},{"category":"060014002001","frequency":1},{"category":"060014002002","frequency":1},{"category":"060014003004","frequency":1},{"category":"060014004002","frequency":1},{"category":"060014007001","frequency":1},{"category":"060014007003","frequency":1},{"category":"060014008001","frequency":1},{"category":"060014010005","frequency":1},{"category":"060014011004","frequency":1},{"category":"060014014002","frequency":1},{"category":"060014014003","frequency":1},{"category":"060014016001","frequency":1},{"category":"060014016002","frequency":1},{"category":"060014017001","frequency":1},{"category":"060014017002","frequency":1},{"category":"060014017003","frequency":1},{"category":"060014022003","frequency":1},{"category":"060014025002","frequency":1},{"category":"060014027002","frequency":1},{"category":"060014028002","frequency":1},{"category":"060014030002","frequency":1},{"category":"060014031001","frequency":1},{"category":"060014033001","frequency":1},{"category":"060014034001","frequency":1},{"category":"060014034002","frequency":1},{"category":"060014035012","frequency":1},{"category":"060014036001","frequency":1},{"category":"060014037021","frequency":1},{"category":"060014038002","frequency":1},{"category":"060014045024","frequency":1},{"category":"060014046004","frequency":1},{"category":"060014049003","frequency":1},{"category":"060014049004","frequency":1},{"category":"060014053011","frequency":1},{"category":"060014059013","frequency":1},{"category":"060014059021","frequency":1},{"category":"060014059022","frequency":1},{"category":"060014060001","frequency":1},{"category":"060014060002","frequency":1},{"category":"060014060003","frequency":1},{"category":"060014061001","frequency":1},{"category":"060014061002","frequency":1},{"category":"060014061004","frequency":1},{"category":"060014073002","frequency":1},{"category":"060014074003","frequency":1},{"category":"060014077001","frequency":1},{"category":"060014078001","frequency":1},{"category":"060014078002","frequency":1},{"category":"060014079003","frequency":1},{"category":"060014080001","frequency":1},{"category":"060014080002","frequency":1},{"category":"060014081001","frequency":1},{"category":"060014081002","frequency":1},{"category":"060014081003","frequency":1},{"category":"060014083002","frequency":1},{"category":"060014087002","frequency":1},{"category":"060014088002","frequency":1},{"category":"060014089001","frequency":1},{"category":"060014089002","frequency":1},{"category":"060014090001","frequency":1},{"category":"060014090002","frequency":1},{"category":"060014090003","frequency":1},{"category":"060014090004","frequency":1},{"category":"060014094002","frequency":1},{"category":"060014096004","frequency":1},{"category":"060014097003","frequency":1},{"category":"060014097004","frequency":1},{"category":"060014099001","frequency":1},{"category":"060014099002","frequency":1},{"category":"060014099003","frequency":1},{"category":"060014100002","frequency":1},{"category":"060014105001","frequency":1},{"category":"060014201001","frequency":1},{"category":"060014201002","frequency":1},{"category":"060014204001","frequency":1},{"category":"060014211001","frequency":1},{"category":"060014214001","frequency":1},{"category":"060014214002","frequency":1},{"category":"060014215001","frequency":1},{"category":"060014217001","frequency":1},{"category":"060014218002","frequency":1},{"category":"060014219002","frequency":1},{"category":"060014220001","frequency":1},{"category":"060014220002","frequency":1},{"category":"060014221001","frequency":1},{"category":"060014221002","frequency":1},{"category":"060014222001","frequency":1},{"category":"060014224001","frequency":1},{"category":"060014226001","frequency":1},{"category":"060014229002","frequency":1},{"category":"060014235003","frequency":1},{"category":"060014238002","frequency":1},{"category":"060014239012","frequency":1},{"category":"060014239022","frequency":1},{"category":"060014251011","frequency":1},{"category":"060014251023","frequency":1},{"category":"060014251031","frequency":1},{"category":"060014251032","frequency":1},{"category":"060014251041","frequency":1},{"category":"060014251042","frequency":1},{"category":"060014261004","frequency":1},{"category":"060014262002","frequency":1},{"category":"060014272004","frequency":1},{"category":"060014273002","frequency":1},{"category":"060014273005","frequency":1},{"category":"060014277001","frequency":1},{"category":"060014277003","frequency":1},{"category":"060014280001","frequency":1},{"category":"060014281004","frequency":1},{"category":"060014282001","frequency":1},{"category":"060014282002","frequency":1},{"category":"060014283011","frequency":1},{"category":"060014283014","frequency":1},{"category":"060014283023","frequency":1},{"category":"060014284001","frequency":1},{"category":"060014285002","frequency":1},{"category":"060014287002","frequency":1},{"category":"060014301011","frequency":1},{"category":"060014301013","frequency":1},{"category":"060014301021","frequency":1},{"category":"060014302001","frequency":1},{"category":"060014305001","frequency":1},{"category":"060014306002","frequency":1},{"category":"060014324001","frequency":1},{"category":"060014324002","frequency":1},{"category":"060014324003","frequency":1},{"category":"060014326001","frequency":1},{"category":"060014326002","frequency":1},{"category":"060014326005","frequency":1},{"category":"060014328003","frequency":1},{"category":"060014331021","frequency":1},{"category":"060014331041","frequency":1},{"category":"060014332003","frequency":1},{"category":"060014332004","frequency":1},{"category":"060014333002","frequency":1},{"category":"060014334001","frequency":1},{"category":"060014334004","frequency":1},{"category":"060014337002","frequency":1},{"category":"060014338001","frequency":1},{"category":"060014338004","frequency":1},{"category":"060014351031","frequency":1},{"category":"060014351032","frequency":1},{"category":"060014351033","frequency":1},{"category":"060014356021","frequency":1},{"category":"060014359003","frequency":1},{"category":"060014360001","frequency":1},{"category":"060014364012","frequency":1},{"category":"060014364013","frequency":1},{"category":"060014401001","frequency":1},{"category":"060014501011","frequency":1},{"category":"060014501021","frequency":1},{"category":"060014501023","frequency":1},{"category":"060014503002","frequency":1},{"category":"060014505012","frequency":1},{"category":"060014505021","frequency":1},{"category":"060014506011","frequency":1},{"category":"060014506012","frequency":1},{"category":"060014506021","frequency":1},{"category":"060014506033","frequency":1},{"category":"060014506034","frequency":1},{"category":"060014506042","frequency":1},{"category":"060014506071","frequency":1},{"category":"060014506072","frequency":1},{"category":"060014507013","frequency":1},{"category":"060014507014","frequency":1},{"category":"060014507411","frequency":1},{"category":"060014507423","frequency":1},{"category":"060014507431","frequency":1},{"category":"060014507432","frequency":1},{"category":"060014507441","frequency":1},{"category":"060014507452","frequency":1},{"category":"060014507461","frequency":1},{"category":"060014507462","frequency":1},{"category":"060014507521","frequency":1},{"category":"060014511011","frequency":1},{"category":"060014511014","frequency":1},{"category":"060014511015","frequency":1},{"category":"060014511022","frequency":1},{"category":"060014512011","frequency":1},{"category":"060014512013","frequency":1},{"category":"060014512021","frequency":1},{"category":"060014513001","frequency":1},{"category":"060014513003","frequency":1},{"category":"060014514012","frequency":1},{"category":"060014514042","frequency":1},{"category":"060014515012","frequency":1},{"category":"060014515041","frequency":1},{"category":"060014516021","frequency":1},{"category":"060014516024","frequency":1},{"category":"060014517032","frequency":1},{"category":"060019819001","frequency":1},{"category":"060019820001","frequency":1},{"category":"060019832001","frequency":1}]},"geoid_co":{"type":"string","categories":[{"category":"06001","frequency":194}]},
#                      "geoid_co": {
#                        "type": "string",
#                        "categories": [
#                          {
#                            "category": "06001",
#                            "frequency": 194
#                          }
#                        ]
#                      },
#                      "name_co": {
#                        "type": "string",
#                        "categories": [
#                          {
#                            "category": "Alameda",
#                            "frequency": 194
#                          }
#                        ]
#                      },
#                      "state_abbr": {
#                        "type": "string",
#                        "categories": [
#                          {
#                            "category": "CA",
#                            "frequency": 194
#                          }
#                        ]
#                      },
#                      "subsidy_recipient": {
#                        "type": "string",
#                        "categories": [
#                          {
#                            "category": "Space Exploration Technologies Corp.",
#                            "frequency": 118
#                          },
#                          {
#                            "category": "LTD Broadband LLC",
#                            "frequency": 40
#                          },
#                          {
#                            "category": "Etheric Communications LLC",
#                            "frequency": 29
#                          },
#                          {
#                            "category": "One Ring Networks, Inc",
#                            "frequency": 7
#                          }
#                        ]
#                      },
#                      "tier": {
#                        "type": "string",
#                        "categories": [
#                          {
#                            "category": "Above Baseline",
#                            "frequency": 118
#                          },
#                          {
#                            "category": "Gigabit",
#                            "frequency": 69
#                          },
#                          {
#                            "category": "Baseline",
#                            "frequency": 7
#                          }
#                        ]
#                      },
#                      "the_geom_webmercator": {
#                        "type": "geometry"
#                      }
#                    },
#                    "dimensions": {}
#                  },
#                  "dates_as_numbers": []
#                },
#                "tilejson": {
#                  "vector": {
#                    "tilejson": "2.2.0",
#                    "tiles": [
#                      "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/layer0/{z}/{x}/{y}.mvt?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                    ]
#                  },
#                  "raster": {
#                    "tilejson": "2.2.0",
#                    "tiles": [
#                      "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/layer0/{z}/{x}/{y}.png?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                    ]
#                  }
#                }
#              }
#         ],
#         "dataviews": {},
#         "analyses": [],
#         "tilejson": {
#             "vector": {
#                "tilejson": [
#                  "2.2.0"
#                ],
#                "tiles": [
#                  "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/{z}/{x}/{y}.mvt?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                ]
#              },
#              "raster": {
#                "tilejson": [
#                  "2.2.0"
#                ],
#                "tiles": [
#                  "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/{z}/{x}/{y}.png?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                ]
#              }
#         },
#         "url": {
#             "vector": {
#                "urlTemplate": [
#                  "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/{z}/{x}/{y}.mvt?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                ],
#                "subdomains": []
#              },
#              "raster": {
#                "urlTemplate": [
#                  "https://oscarto.ruralinnovation.us/user/admin/api/v1/map/fc9e6770986930363e107cd17d16f72c:1639516253094/{z}/{x}/{y}.png?api_key=OcrLh4ETkKlHN0LUgHxwmA"
#                ],
#                "subdomains": []
#              }
#             }
#         },
#         "cdn_url": {},
#         "last_updated": [
#             "2021-12-14T21:10:53.094Z"
#         ]
#     }
#

# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)
