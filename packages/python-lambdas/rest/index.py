# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
import awsgi
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
from flask import Flask, jsonify, url_for
from flask_cors import CORS

import acs as acs
import bcat as bcat
import ch as ch

# app = APIGatewayRestResolver(strip_prefixes=["/rest"])
app = Flask(__name__)
CORS(app)

logger = Logger(service="CORIDataAPIRestService")
tracer = Tracer(service="CORIDataAPIRestService")

"""
Basic Flask capability testing...
"""

@app.route("/rest/hello")
def greet():
    return jsonify(
        message='Hello from Lambda!'
    )

app.add_url_rule('/rest/acs/testing', 'acs_get', acs.get)

"""
bcat layer feature count
"""
app.add_url_rule('/rest/bcat/<table>/count', 'bcat_count',  bcat.get_bcat_count)

"""
bcat layer properties
"""
app.add_url_rule('/rest/bcat/<table>', 'bcat_properties',  bcat.get_bcat_props)

"""
bcat layer geojson
"""
app.add_url_rule('/rest/bcat/<table>/geojson', 'bcat_geojson',  bcat.get_bcat_geojson)

"""
ch geo bbox at location
"""
app.add_url_rule('/rest/ch/<tab>/at_location', 'ch_bbox_at_location',  ch.get_bbox_at_location)

"""
ch bb map (block -> FeatureCollection)
"""
app.add_url_rule('/rest/ch/<tab>/bb_map', 'ch_bb_map',  ch.get_bb_map)


@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    # print(event)

    # return app.resolve(event, context)
    return awsgi.response(app, event, context)


if __name__ == "__main__":
    app.debug = False
    app.run()
