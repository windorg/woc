module.exports = {
  "overrides": [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  ],
  "parser": '@typescript-eslint/parser',
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:compat/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "next/core-web-vitals",
  ],
  "plugins": [
    "@typescript-eslint",
    "ban",
  ],
  "env": {
    "browser": true
  },
  "rules": {
    "array-callback-return": ['error', { allowImplicit: true }],
    'default-case': ['error', { commentPattern: '^no default$' }],
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'valid-typeof': ["error", { "requireStringLiterals": true }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-non-null-assertion': ['off'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-namespace': ['off'],
    '@typescript-eslint/ban-ts-comment': ['off'],
    'prefer-const': ['off'],
    'no-unused-expressions': ['error', {
      allowShortCircuit: false,
      allowTernary: false,
      allowTaggedTemplates: false,
    }],
    'no-implicit-globals': 'off',
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "MemberExpression[property.name='filter'][object.name!='R']",
        "message": "_.filter and Array.filter have too permissive typings, use R.filter"
      }
    ],
    "ban/ban": [
      1, // warning
      {
        "name": ["_", "reverse"],
        "message": "'reverse' mutates the array in-place; use R.reverse"
      }
    ],
    "react/no-unstable-nested-components": ['error'],
    "react/prop-types": ['off'], // buggy
  }
}