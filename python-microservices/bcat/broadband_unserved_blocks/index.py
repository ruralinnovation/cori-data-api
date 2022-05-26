import os
import psycopg
from psycopg import sql
import boto3
import base64
import json
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver

logger = Logger(service="/bcat/broadband_unserved_blocks")
tracer = Tracer(service="/bcat/broadband_unserved_blocks")
app = APIGatewayRestResolver(strip_prefixes=["/bcat"])

@app.get("/broadband_unserved_blocks")
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
        bcat.bcat_broadband_farm_bill_elligibility AS t
        WHERE state_abbr = 'TX';
    """
    cur.execute(query)
    results = cur.fetchone()
    print(results)
    return results[0]


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)