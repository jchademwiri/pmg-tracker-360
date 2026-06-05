import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const integrationTestPatterns = [
  '<rootDir>/src/server/__tests__/crud-integration.test.ts',
  '<rootDir>/src/server/__tests__/ownership-transfer.test.ts',
];

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^bun:test$': '<rootDir>/src/test/bun-test-shim.ts',
    '^@t3-oss/env-nextjs$': '<rootDir>/src/test/mocks/env-nextjs.ts',
    '^better-auth/plugins/access$':
      '<rootDir>/src/test/mocks/better-auth-access.ts',
    '^better-auth/plugins/organization/access$':
      '<rootDir>/src/test/mocks/better-auth-organization-access.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    String.raw`[/\\]node_modules[/\\](?!((\.bun[/\\](@t3-oss\+env-core|@t3-oss\+env-nextjs|better-auth)@)|(@t3-oss[/\\](env-core|env-nextjs))|better-auth[/\\]))`,
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests-e2e/',
    ...(process.env.RUN_INTEGRATION_TESTS === 'true'
      ? []
      : integrationTestPatterns),
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
