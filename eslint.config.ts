import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  {
    rules: {
      'no-unused-vars': 'off',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/require-description': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'docs/**'],
  }
);
