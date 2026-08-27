module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif|webp)$': '<rootDir>/src/__mocks__/fileMock.cjs',
    // import.meta is a syntax error once Babel emits CJS — see src/api/viteEnv.js
    'viteEnv$': '<rootDir>/src/__mocks__/viteEnvMock.cjs',
  },
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  // Full-app renders driven by userEvent are slow; the 5s default is too tight.
  testTimeout: 20000,
};
