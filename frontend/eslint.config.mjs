import { createESLintConfig } from 'eslint-config-next';

export default createESLintConfig({
  extends: ['eslint:recommended', 'next'],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'jsx-a11y/alt-text': 'off',
  },
});
