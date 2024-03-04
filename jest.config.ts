import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  // globals: {
  //   "ts-jest": {
  //     diagnostics: true
  //   }
  // },
  moduleFileExtensions: [ "cjs", "js", "jsx", "json", "mjs", "node", "ts", "tsx" ],
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      diagnostics: true
    }]
  },
  testEnvironment: "node",
  testRunner: "jest-jasmine2",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$"
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageReporters: ["lcov", "html"]
};

export default config;
