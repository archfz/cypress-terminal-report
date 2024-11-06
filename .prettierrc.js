/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  singleQuote: true,
  printWidth: 100,
  bracketSpacing: false,
  semi: true,
  overrides: [
    {
      files: ['*.md'],
      options: {
        trailingComma: 'none',
        semi: false,
      },
    },
  ],
};
