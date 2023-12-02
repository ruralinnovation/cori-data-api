# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
import awsgi
from flask import Flask, jsonify, make_response
from flask_cors import CORS

# app = APIGatewayRestResolver(strip_prefixes=["/rest"])
app = Flask(__name__)
CORS(app)

logger = Logger(service="CORIDataAPIRestService")
tracer = Tracer(service="CORIDataAPIRestService")


# @app.get("/hello")
@app.route("/rest/hello")
def greet():
    return jsonify(
        status=200,
        message='Hello from Lambda!'
    )


# @app.get("/test")
@app.route("/rest/test")
def get_test():
    print("testing root route")

    return {
        "message": "success"
    }


@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    print(event)

    # return app.resolve(event, context)
    return awsgi.response(app, event, context)


if __name__ == "__main__":
    app.debug = False
    app.run()
