import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  // globals: {
  //   'ts-jest': {
  //     diagnostics: true
  //   }
  // },
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": ['ts-jest', {
      diagnostics: true
    }]
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['lcov', 'html']
};

export default config;
