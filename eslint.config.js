import globals from 'globals';
export default [
  {
    files: ['**/*.js'],
    ignores: ['index.js', 'node_modules/*', 'extras/**', 'test/**', 'coverage/*', '.nyc-output'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2023,
      sourceType: 'module',
    },
  },
];
