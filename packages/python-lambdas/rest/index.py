# from aws_lambda_powertools.event_handler.api_gateway import APIGatewayRestResolver, Response
import awsgi
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools import Logger, Tracer
from flask import Flask, jsonify, url_for
from flask_cors import CORS

import acs as acs
import bcat as bcat
import bead as bead
import ch as ch
import places as pl

# app = APIGatewayRestResolver(strip_prefixes=["/rest"])
app = Flask(__name__)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "*"}})  # Apply CORS only to /api routes

logger = Logger(service="CORIDataAPIRestService")
tracer = Tracer(service="CORIDataAPIRestService")

"""
Basic Flask capability testing...
"""
# This is needed to handle OPTIONS requests at the root path (/) ... according to Bard
@app.route("/")
def greet():
    return jsonify(
        message='Hello from Lambda!'
    )


app.add_url_rule('/rest/hello', 'get_hello', greet)

app.add_url_rule('/rest/acs/testing', 'acs_get', acs.get)

"""
bcat layer feature count
"""
app.add_url_rule('/rest/bcat/<table>/count', 'bcat_count', bcat.get_bcat_count)

"""
bcat layer properties
"""
app.add_url_rule('/rest/bcat/<table>', 'bcat_properties', bcat.get_bcat_props)

"""
bcat layer geojson
"""
app.add_url_rule('/rest/bcat/<table>/geojson', 'bcat_geojson', bcat.get_bcat_geojson)

"""
bead geojson, acs, isp tech, and awards (rdof)
"""
app.add_url_rule('/rest/bead/<tab>', 'bead_detailed_info', bead.get_bead_detailed_info)

"""
bead isp id to combo(s)
"""
app.add_url_rule('/rest/bead/isp_combo', 'bead_isp_id_to_combo', bead.get_bead_isp_id_to_combo)

"""
ch list available county or tract variables
"""
app.add_url_rule('/rest/ch/<tab>/vars', 'ch_vars', ch.get_ch_vars)

"""
ch get values for county or tract variables
"""
app.add_url_rule('/rest/ch/<tab>', 'ch_values', ch.get_ch_values)

"""
ch county/tract geojson
"""
app.add_url_rule('/rest/ch/<tab>/geo', 'ch_geo', ch.get_ch_geo)

"""
ch neighboring geos (same state/county)
"""
app.add_url_rule('/rest/ch/<tab>/overall_neighbor_geos', 'ch_overall_neighbor_geos', ch.get_ch_overall_neighbor_geos)

"""
ch geo bbox at location
"""
app.add_url_rule('/rest/ch/<tab>/at_location', 'ch_bbox_at_location', ch.get_bbox_at_location)

"""
ch bb map (block -> FeatureCollection)
"""
app.add_url_rule('/rest/ch/ch_bb_map/<tab>', 'ch_bb_map', ch.get_bb_map)

"""
places geojson
"""
app.add_url_rule('/rest/places/<tab>', 'pl_places_info', pl.get_places_info)


@tracer.capture_lambda_handler
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
def handler(event, context):
    # print(event)

    # return app.resolve(event, context)
    return awsgi.response(app, event, context)


if __name__ == "__main__":
    app.debug = False
    app.run()
