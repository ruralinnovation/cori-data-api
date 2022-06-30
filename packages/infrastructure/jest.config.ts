import type { InitialOptionsTsJest } from 'ts-jest/dist/types';
import baseJest from '../../jest.config';

const config: InitialOptionsTsJest = {
  ...baseJest,
  roots: ['<rootDir>/spec']
};

export default config;
