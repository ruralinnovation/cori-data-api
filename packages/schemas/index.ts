import { join } from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { addResolversToSchema } from "@graphql-tools/schema";
import { printSchema } from "graphql";
const { execSync } = require("child_process");

// Load schema from the file
const schema = loadSchemaSync("./graphql/**/*.graphql", {
  loaders: [new GraphQLFileLoader()],
});

console.log("Checking ... ", printSchema(schema));

if (!existsSync("dist")) {
  mkdirSync("dist");
}
writeFileSync("dist/schema.graphql", printSchema(schema));

//execSync("hive schema:publish ./dist/schema.graphql");
