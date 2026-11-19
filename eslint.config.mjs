import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import eslintReact from '@eslint-react/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'
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
    eslintReact.configs['recommended-typescript'],
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
            '@stylistic': stylistic,
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
            '@stylistic/jsx-first-prop-new-line': [
                'error',
                'multiline',
            ],
            '@stylistic/jsx-closing-bracket-location': [
                2,
                'line-aligned',
            ],
            'no-restricted-syntax': ['error', ...buttonRules],
            // The two rules of hooks come from the plugin of the React team, under the names the
            // code already disables them by.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@eslint-react/rules-of-hooks': 'off',
            '@eslint-react/exhaustive-deps': 'off',
            // The library compiles JSX to React.createElement, where the place of `key` costs
            // nothing; a `key` after the spread overrides the key MUI puts into the props.
            '@eslint-react/jsx-no-key-after-spread': 'off',
            // Off since the plugin came (ESLint 10, 2026-11): each of them has findings in the
            // code as it is, and nobody has gone through them yet. Hits then: set-state-in-effect
            // 42, no-forward-ref 36, no-use-context 34, no-context-provider 19, no-array-index-key
            // 14, ref and id names 8, use-state 7, purity 5, the Children API and cloneElement 6,
            // dangerouslySetInnerHTML 2.
            '@eslint-react/set-state-in-effect': 'off',
            '@eslint-react/no-forward-ref': 'off',
            '@eslint-react/no-use-context': 'off',
            '@eslint-react/no-context-provider': 'off',
            '@eslint-react/no-array-index-key': 'off',
            '@eslint-react/naming-convention-ref-name': 'off',
            '@eslint-react/naming-convention-id-name': 'off',
            '@eslint-react/use-state': 'off',
            '@eslint-react/purity': 'off',
            '@eslint-react/no-children-to-array': 'off',
            '@eslint-react/no-children-map': 'off',
            '@eslint-react/no-children-count': 'off',
            '@eslint-react/no-clone-element': 'off',
            '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
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
        // A story explains itself in prose, and a sentence may end a tag with a semicolon.
        files: ['src/stories/**', 'src/**/*.stories.tsx'],
        rules: {
            '@eslint-react/jsx-no-leaked-semicolon': 'off',
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
