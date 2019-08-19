module.exports = {
  extends: 'algolia',
  rules: {
    'valid-jsdoc': 'off',
    // The "no-unresolved" rule is needed for the CI
    // because it runs ESLint without installating the
    // examples' dependencies first.
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
