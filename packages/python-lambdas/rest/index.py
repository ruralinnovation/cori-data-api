# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
import awsgi
from flask import Flask, jsonify, make_response, url_for
from flask_cors import CORS

import acs.index as acs
import bcat.index as bcat

# app = APIGatewayRestResolver(strip_prefixes=["/rest"])
app = Flask(__name__)
CORS(app)

logger = Logger(service="CORIDataAPIRestService")
tracer = Tracer(service="CORIDataAPIRestService")


@app.route("/")
@app.route("/rest/")
@app.route("/rest/index")
def index():
    greet_url = url_for('greet')
    test_url = url_for('test')
    acs_url = url_for('acs_get')
    return "<a href={}>Click to greet</a>".format(greet_url) + \
        "<br />" + \
        "<a href={}>Click to test</a>".format(acs_url)


# @app.get("/hello")
@app.route("/rest/hello")
def greet():
    return jsonify(
        message='Hello from Lambda!'
    )


# @app.get("/test")
@app.route("/rest/test")
def test():
    print("testing root route")

    return {
        "message": "success"
    }


app.add_url_rule('/rest/acs/testing', 'acs_get', acs.get)
app.add_url_rule('/rest/bcat/<table>/count', 'bcat_count',  bcat.get_bcat_count)


@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    print(event)

    # return app.resolve(event, context)
    return awsgi.response(app, event, context)


if __name__ == "__main__":
    app.debug = False
    app.run()
