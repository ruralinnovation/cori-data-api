import os
import psycopg
import boto3
import json
import base64
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver


logger = Logger(service="LocalApi")
tracer = Tracer(service="LocalApi")
app = APIGatewayRestResolver(strip_prefixes=["/local"])


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


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)