import os
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError


logger = Logger(service="LeeService")
tracer = Tracer(service="LeeService")
app = APIGatewayRestResolver(strip_prefixes=["/lee-service"])


@app.get(rule="/bad-request-error")
def bad_request_error(msg):
    # HTTP  400
    raise BadRequestError(msg)


@app.get("/magic", compress=False)
def get():
    print('Hello lee, this is magic')
    return {
        "response": "this is magic"
    }

# You can continue to use other utilities just as before
@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    return app.resolve(event, context)