import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import storybookPlugin from 'eslint-plugin-storybook'

// The button is the MUI Button drawn by the theme (README, «Кнопка»). The theme has a look for these
// pairs of `variant` and `color` only; any other pair would be drawn as its variant in the brand
// colour, so writing one is a mistake. The same rules stand in the applications.
const BUTTON = 'JSXOpeningElement[name.name="Button"]'
const withAttribute = (name, values) =>
    `:has(> JSXAttribute[name.name="${name}"]:matches([value.value=/^(${values})$/], [value.expression.value=/^(${values})$/]))`
const buttonRules = [
    {
        selector: `${BUTTON}${withAttribute('variant', 'outlined|soft')}${withAttribute('color', 'error|warning|success')}`,
        message: 'An outlined or soft button has the brand colour only: drop `color`, or use variant="contained" or "text" with it.',
    },
    {
        selector: `${BUTTON}${withAttribute('variant', 'contained')}${withAttribute('color', 'success')}`,
        message: 'There is no filled success button: variant="contained" takes color="error" or "warning"; an activation is variant="text" color="success".',
    },
    {
        selector: `${BUTTON}${withAttribute('variant', 'text')}${withAttribute('color', 'warning')}`,
        message: 'There is no text warning button: variant="text" takes color="error" or "success"; a caution is variant="contained" color="warning".',
    },
    {
        // No `variant` is `text`; a spread may bring the variant, so such a button is left alone.
        selector: `${BUTTON}:not(:has(> JSXAttribute[name.name="variant"])):not(:has(> JSXSpreadAttribute))${withAttribute('color', 'warning')}`,
        message: 'A button without `variant` is a text button, and there is no text warning button: a caution is variant="contained" color="warning".',
    },
]

export default [
    {
        ignores: [
            'node_modules/**',
            'cjs/**',
            'esm/**',
            'storybook-static/**',
            '.release/**',
        ],
    },
    js.configs.recommended,
    ...tsPlugin.configs['flat/recommended'],
    reactPlugin.configs.flat.recommended,
    ...storybookPlugin.configs['flat/recommended'],
    {
        files: ['**/*.{js,mjs,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                JSX: 'readonly',
            },
        },
        plugins: {
            'react-hooks': reactHooksPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            indent: [
                'error',
                4,
                {
                    SwitchCase: 1,
                },
            ],
            'linebreak-style': [
                'error',
                'unix',
            ],
            'react/jsx-first-prop-new-line': [
                'error',
                'multiline',
            ],
            'react/jsx-closing-bracket-location': [
                2,
                'line-aligned',
            ],
            'no-restricted-syntax': ['error', ...buttonRules],
            'react/display-name': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-prototype-builtins': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'no-unused-expressions': 'off',
            'array-bracket-spacing': [
                'error',
                'never',
            ],
        },
    },
    {
        // Library code imports the module that declares a symbol. The barrels (src/index.ts,
        // src/exports/*, a folder's index) re-export everything, so importing them from inside src
        // closes import cycles: before 5.0 SearchUI went through '../..' and tied 61 modules together.
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/index.ts', 'src/exports/**', 'src/stories/**', 'src/**/*.stories.tsx'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: '^(\\.\\./)*\\.\\.?(/index)?$|(^|/)exports(/|$)',
                            message: 'Import the module that declares the symbol, not a pne-ui barrel: barrels close import cycles.',
                        },
                    ],
                },
            ],
        },
    },
]
