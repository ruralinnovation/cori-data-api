import type { JestConfigWithTsJest } from 'ts-jest';
import baseJest from '../../jest.config';

const config: JestConfigWithTsJest = {
  ...baseJest,
  roots: ['<rootDir>/spec'],
};

export default config;
