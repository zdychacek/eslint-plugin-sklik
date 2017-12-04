module.exports = {
  env: {
    browser: false,
  },
  extends: "./node_modules/@sklik/eslint-config/.eslintrc",
  parserOptions: {
    sourceType: "module"
  },
  rules: {
    indent: [ 2, 2 ],
    strict: 0,
  }
};
