import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';
import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql';
import GeoJSON from './graphql/geojson';
const { execSync } = require('child_process');
// Load schema from the file
// const baseSchema = loadSchemaSync('./graphql/query.graphql', {
//   loaders: [new GraphQLFileLoader()],
// });

// console.log("Checking ... ", printSchema(schema));

//execSync("hive schema:publish ./dist/schema.graphql");

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    setup: {
      type: GeoJSON.GeometryTypeUnion
    },
    hello: {
      type: GeoJSON.FeatureCollectionObject
    },
    auction_904_subsidy_awards: {
      type: GeoJSON.FeatureCollectionObject
    }
  }
});

const schema = new GraphQLSchema({
  query: Query
});

if (!existsSync('dist')) {
  mkdirSync('dist');
}
writeFileSync('dist/schema.graphql', printSchema(schema));
