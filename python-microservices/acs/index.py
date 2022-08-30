import os
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

from acs_connection import execute

logger = Logger(service="ACSService")
tracer = Tracer(service="ACSService")
app = APIGatewayRestResolver(strip_prefixes=["/acs"])


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


@app.get("/testing", compress=False)
def get():
    print("testing acs endpoint /testing")

    """
    construct and execute a query to <table> with where clause based on <params>
    """
    logger.info(os.environ)

    # get some short names of parameters used to construct the query
    db_table = "acs.acs_5_yr_county"
    columns = "*"
    # id = CONFIG[table].get('id', None)

    query = f"""
        SELECT {columns} FROM {db_table} LIMIT 1;

        """

    query_result = execute(query)

    logger.debug(query_result)

    return {
        "message": query_result[0].variable
    }

#     return {
#         "message": "success"
#     }

# @app.get("/<table>/geojson", compress=False)
# def get(table):
#     print(table)

# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)