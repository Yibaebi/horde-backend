import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  ignores: ['dist', 'node_modules'],
  rules: {
    ...prettier.rules,
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
});
