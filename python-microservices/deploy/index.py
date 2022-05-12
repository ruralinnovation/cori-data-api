import os
import psycopg
import boto3
import base64
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver


# def get_secret(secret_name):

#     region_name = os.environ['REGION']

#     # Create a Secrets Manager client
#     session = boto3.session.Session()
#     client = session.client(
#         service_name='secretsmanager',
#         region_name=region_name
#     )

#     # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
#     # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
#     # We rethrow the exception by default.

#     try:
#         get_secret_value_response = client.get_secret_value(
#             SecretId=secret_name
#         )
#     except ClientError as e:
#         if e.response['Error']['Code'] == 'DecryptionFailureException':
#             # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
#             # Deal with the exception here, and/or rethrow at your discretion.
#             raise e
#         elif e.response['Error']['Code'] == 'InternalServiceErrorException':
#             # An error occurred on the server side.
#             # Deal with the exception here, and/or rethrow at your discretion.
#             raise e
#         elif e.response['Error']['Code'] == 'InvalidParameterException':
#             # You provided an invalid value for a parameter.
#             # Deal with the exception here, and/or rethrow at your discretion.
#             raise e
#         elif e.response['Error']['Code'] == 'InvalidRequestException':
#             # You provided a parameter value that is not valid for the current state of the resource.
#             # Deal with the exception here, and/or rethrow at your discretion.
#             raise e
#         elif e.response['Error']['Code'] == 'ResourceNotFoundException':
#             # We can't find the resource that you asked for.
#             # Deal with the exception here, and/or rethrow at your discretion.
#             raise e
#     else:
#         # Decrypts secret using the associated KMS key.
#         # Depending on whether the secret is a string or binary, one of these fields will be populated.
#         if 'SecretString' in get_secret_value_response:
#             return json.loads(get_secret_value_response['SecretString'])
#         else:
#             return base64.b64decode(get_secret_value_response['SecretBinary'])

# def getCredentials():
#     credential = {}    
#     credential['username'] = os.environ['DB_USER']
#     credential['password'] = os.environ['SECRET']
#     credential['host'] = os.environ['DB_HOST']
#     credential['dbname'] = os.environ['DB_NAME']
    
#     return credential

logger = Logger(service="testApi")
tracer = Tracer(service="testApi")
app = APIGatewayRestResolver(strip_prefixes=["/api"])


@app.get("/hello/<name>")
def get_hello_you(name):
    return {"hello": f"hello {name}"}

@app.get("/hello")
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
    query = `
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
    `
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