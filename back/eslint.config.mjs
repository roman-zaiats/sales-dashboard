import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import _import from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import stylisticEslintPlugin from '@stylistic/eslint-plugin';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/*.js',
      '**/*.mjs',
      '**/*jest.config.ts',
      '**/drizzle.config.ts',
      'src/generated/**/*',
      'node_modules/**',
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
      '*.log',
      '*.tmp',
      '*.swp',
      '.env*',
      '.vscode/**',
      '.idea/**',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
      import: fixupPluginRules(_import),
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      '@stylistic': stylisticEslintPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
      },
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      curly: 'error',

      'brace-style': [
        'warn',
        '1tbs',
        {
          allowSingleLine: false,
        },
      ],

      'no-constant-condition': [
        'error',
        {
          checkLoops: false,
        },
      ],

      'object-shorthand': 'error',
      'no-unsafe-finally': 'off',
      'implicit-arrow-linebreak': 'off',

      'import/no-internal-modules': [
        'error',
        {
          forbid: ['@shared/**/*', '@root/**/!(package.json)'],
        },
      ],

      'import/no-unresolved': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-floating-promises': 'error',

      '@stylistic/lines-between-class-members': [
        'error',
        {
          enforce: [
            {
              blankLine: 'always',
              prev: 'field',
              next: 'method',
            },
            {
              blankLine: 'always',
              prev: 'method',
              next: '*',
            },
          ],
        },
      ],

      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: 'block-like',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'block-like',
        },
      ],

      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],

      'no-restricted-imports': [
        'error',
        {
          patterns: ['@worker/*', '@leader/*', '@naomi/*', '@chromius/*', '!@shared/*'],
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'import/no-internal-modules': 'off',
    },
  },
];
