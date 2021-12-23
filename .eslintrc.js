module.exports = {
  "extends": [
    "next/core-web-vitals",
    "plugin:compat/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],
  "plugins": [
    "ban"
  ],
  "env": {
    "browser": true
  },
  "rules": {
    "array-callback-return": ['error', { allowImplicit: true }],
    'default-case': ['error', { commentPattern: '^no default$' }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
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
  }
}