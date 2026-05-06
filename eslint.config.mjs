import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import storybookPlugin from 'eslint-plugin-storybook'

export default [
    {
        ignores: [
            'node_modules/**',
            'cjs/**',
            'esm/**',
            'storybook-static/**',
        ],
    },
    js.configs.recommended,
    ...tsPlugin.configs['flat/recommended'],
    reactPlugin.configs.flat.recommended,
    ...storybookPlugin.configs['flat/recommended'],
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
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
]
