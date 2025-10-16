/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	trailingComma: 'es5',
	arrowParens: 'avoid',
	bracketSpacing: true,
	jsxSingleQuote: true,
	singleAttributePerLine: true,
	semi: true,
	singleQuote: true,
	useTabs: true,
	tabWidth: 4,
	overrides: [
		{
			files: ['*.yml', '*.yaml'],
			options: {
				tabWidth: 2,
				useTabs: false,
			},
		},
		{
			files: ['*.json', '*.json5'],
			options: {
				tabWidth: 4,
				useTabs: true,
			},
		},
	],
};

export default config;
