import os
import psycopg
from psycopg import sql
import boto3
import base64
import json
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from io import BytesIO
import base64
import gzip

logger = Logger(service="bcat-service")
tracer = Tracer(service="bcat-service")
app = APIGatewayRestResolver(strip_prefixes=["/bcat"])

def gzip_b64encode(data):
    compressed = BytesIO()
    with gzip.GzipFile(fileobj=compressed, mode='w') as f:
        json_response = json.dumps(data)
        f.write(json_response.encode('utf-8'))
    return base64.b64encode(compressed.getvalue()).decode('ascii')

@app.get("/<table>", compress=True)
def get(table):
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
        WHERE geoid_co IN ('47033', '47167');
    """
    cur.execute(query)
    results = cur.fetchone()
    print('Response Length ' + str(len(json.dumps(results[0]))))
    print('Response Length ' + str(len(gzip_b64encode(results[0]))))
    return results[0]


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)