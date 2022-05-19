import os
import psycopg
import boto3
import base64
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver

logger = Logger(service="BCAT_API")
tracer = Tracer(service="BCAT_API")
app = APIGatewayRestResolver(strip_prefixes=["/api"])



@app.get("/bcat/")
def get_hello_you(name):
    return {"hello": f"hello {name}"}

@app.get("/bcat")
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
    set schema 'acs';
    select geoid_co, variable, estimate
    from acs_5_yr_county
    where variable in ('race_white_non_hispanic_pct',
                       'race_black_or_african_american_non_hispanic_pct',
                       'race_american_indian_and_alaska_native_non_hispanic_pct',
                       'race_asian_non_hispanic_pct',
                       'race_native_hawaiian_and_other_pacific_islander_non_hispanic_pct',
                       'race_some_other_race_non_hispanic_pct',
                       'two_or_more_races_non_hispanic_pct') and year = (select max(year) from acs_5_yr_county);
    """
    # execute a statement
    print('PostgreSQL database version:')
    cur.execute(query)

    # display the PostgreSQL database server version
    results = cur.fetchone()
    print(results)
    # return {"hello": f"hello this is the wonderful home route, your version is {db_version}"}
    return {"hello": f"results {results}"}


# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)