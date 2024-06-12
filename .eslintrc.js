module.exports = {
  extends: [
    "plugin:perfectionist/recommended-natural",
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  ignorePatterns: ["/**/*.js", "src/**/*.js", "src/**/*.jsx"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "perfectionist"],
  root: true,
  rules: {}
};
