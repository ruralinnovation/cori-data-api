from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import APIGatewayRestResolver

logger = Logger(service="APP")
tracer = Tracer(service="APP")
app = APIGatewayRestResolver(strip_prefixes=["/api"])

@app.get("/hello/<name>")
def get_hello_you(name):
    return {"hello": f"hello {name}"}

@app.get("/hello")
def get_hello():
    return {"hello": f"hello this is the wonderful home route"}

# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)