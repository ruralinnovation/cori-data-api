/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import county_summary from "./county_summary";
import county_summary_geojson from "./county_summary_geojson";
import auction_904_subsidy_awards_geojson from "./auction_904_subsidy_awards_geojson";
import auction_904_authorized from "./auction_904_authorized";
import auction_904_authorized_geojson from "./auction_904_authorized_geojson";
import auction_904_ready_geojson from "./auction_904_ready_geojson";
import auction_904_defaults_geojson from "./auction_904_defaults_geojson";

const bcatQueries: any = {
  county_summary: county_summary,
  county_summary_geojson: county_summary_geojson,
  auction_904_authorized: auction_904_authorized,
  auction_904_authorized_geojson: auction_904_authorized_geojson,
  auction_904_ready_geojson: auction_904_ready_geojson,
  auction_904_defaults_geojson: auction_904_defaults_geojson,
  auction_904_subsidy_awards_geojson: auction_904_subsidy_awards_geojson,
};

export default bcatQueries;
