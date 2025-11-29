/**
 * Jest Configuration for APIX v2
 *
 * This configuration sets up Jest for testing TypeScript code with:
 * - ts-jest preset for TypeScript support
 * - Path aliases for easier imports
 * - Coverage collection
 * - Multiple test patterns
 */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Run tests in Node.js environment (not browser)
  testEnvironment: 'node',

  // Where to look for test files
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Patterns to match test files:
  // - Files in __tests__ directories: src/blockchain/__tests__/MyTest.ts
  // - Files ending in .test.ts or .spec.ts: MyComponent.test.ts
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // How to transform TypeScript files before testing
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        // Enable path mapping for tests
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
          '@blockchain/*': ['src/blockchain/*'],
          '@test-utils/*': ['tests/utils/*'],
          '@test-mocks/*': ['tests/mocks/*'],
        }
      }
    }],
  },

  // Path aliases - allows importing like: import { X } from '@blockchain/adapters'
  // instead of: import { X } from '../../../blockchain/adapters'
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@blockchain/(.*)$': '<rootDir>/src/blockchain/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@analysis/(.*)$': '<rootDir>/src/analysis/$1',
    '^@planning/(.*)$': '<rootDir>/src/planning/$1',
    '^@hedera/(.*)$': '<rootDir>/src/hedera/$1',
    '^@templates/(.*)$': '<rootDir>/src/templates/$1',
    '^@generation/(.*)$': '<rootDir>/src/generation/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@test-utils/(.*)$': '<rootDir>/tests/utils/$1',
    '^@test-mocks/(.*)$': '<rootDir>/tests/mocks/$1'
  },

  // Collect test coverage from these files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts', // Usually just exports
    '!src/cli/index.ts', // Entry point
  ],

  // Coverage threshold - tests fail if coverage is below these percentages
  // Note: singular "coverageThreshold" not plural
  coverageThreshold: {
    global: {
      branches: 70,    // 70% of code branches tested
      functions: 70,   // 70% of functions tested
      lines: 70,       // 70% of lines tested
      statements: 70   // 70% of statements tested
    }
  },

  // Timeout for each test (in milliseconds)
  testTimeout: 10000, // 10 seconds - blockchain operations can be slow

  // Clear mock calls and instances between every test
  clearMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,
};