import { join } from "path";
import { writeFileSync } from "fs";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { addResolversToSchema } from "@graphql-tools/schema";
import { printSchema } from "graphql";

// Load schema from the file
const schema = loadSchemaSync("./graphql/**/*.graphql", {
  loaders: [new GraphQLFileLoader()],
});

console.log("Checking ... ", printSchema(schema));

writeFileSync("schema.graphql", printSchema(schema));
