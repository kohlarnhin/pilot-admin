import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const typescriptFiles = ['src/**/*.{ts,tsx}', 'tests/**/*.ts', '*.ts'];

export default [
  { ignores: ['dist/**', 'node_modules/**', '.codex-runs/**', 'skills/**/assets/**', '**/*.tsbuildinfo'] },
  { ...js.configs.recommended, files: [...typescriptFiles, '*.js'] },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: typescriptFiles })),
  {
    files: typescriptFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // Form 等控件刻意兼容 antd 风格的开放值 API，暂不限制显式 any。
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  { files: ['*.{js,ts}', 'tests/**/*.ts'], languageOptions: { globals: globals.node } },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: ['src/utils/id.ts'],
    rules: {
      'no-restricted-properties': ['error', {
        // 同时覆盖 window.crypto / globalThis.crypto 的限定访问。
        property: 'randomUUID',
        message: 'Use createId() from src/utils/id.ts for LAN HTTP support.',
      }],
    },
  },
];
