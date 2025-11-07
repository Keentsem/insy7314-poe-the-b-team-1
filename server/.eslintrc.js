module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: 'warn',
    curly: 'warn',
    'no-useless-escape': 'warn',
    'no-control-regex': 'off',
    'no-extra-semi': 'warn',
  },
};
