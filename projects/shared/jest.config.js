module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/projects/shared/src/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/projects/shared/cypress/'],
  moduleNameMapper: {
    '@cosmos-client/core': '<rootDir>/node_modules/@cosmos-client/core/cjs/index.js',
  },
};
