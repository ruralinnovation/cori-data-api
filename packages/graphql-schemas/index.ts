// import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { printSchema } from 'graphql';
import { schemas } from './merge-schemas';

try {
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }
  writeFileSync('dist/schema.graphql', printSchema(schemas));
} catch (e) {}

export {
  schemas as schema
};
