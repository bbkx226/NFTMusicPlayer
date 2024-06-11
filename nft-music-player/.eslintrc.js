module.exports = {
  extends: ["next/core-web-vitals", "eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  ignorePatterns: ["/**/*.js", "src/**/*.js", "src/**/*.jsx"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    // TODO: Reactivate the rules and address the errors
    "@typescript-eslint/adjacent-overload-signatures": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/sort-type-constituents": "off",
    "no-case-declarations": "off"
  }
};
