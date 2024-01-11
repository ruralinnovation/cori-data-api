# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
# from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
import os
import types

from .acs_config import CONFIG
from .acs_connection import execute

logger = Logger(service="ACSService")
tracer = Tracer(service="ACSService")
# app = APIGatewayRestResolver(strip_prefixes=["/acs"])


"""
acs testing endpoints
"""
def get():
    print("requesting acs endpoint /testing")

    logger.info("testing acs endpoint /testing on system:")
    print(os.environ)
    print(types.BuiltinFunctionType)

    return {
        "message": "success"
    }
