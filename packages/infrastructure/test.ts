const GeoJSON = require('./graphql/geojson');
const { buildSchema, printSchema } = require('graphql');

const str = printSchema(GeoJSON);
