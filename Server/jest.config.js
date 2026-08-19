module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFiles: ["<rootDir>/__tests__/setupEnv.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "app.js",
    "controllers/**/*.js",
    "helpers/**/*.js",
    "middlewares/**/*.js",
    "sockets/**/*.js",
    "routes/**/*.js",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  clearMocks: true,
};
