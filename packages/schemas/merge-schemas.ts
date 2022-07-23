import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { printSchema } from 'graphql';
import { schema } from '.';

if (!existsSync('dist')) {
  mkdirSync('dist');
}
writeFileSync('dist/schema.graphql', printSchema(schema));
