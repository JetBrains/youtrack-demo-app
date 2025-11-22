import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';
import reactRefresh from 'eslint-plugin-react-refresh';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
    {
        ignores: ['dist', '.eslintrc.cjs', 'eslint.config.mjs'],
    },
    js.configs.recommended,
    ...compat.extends(
        '@jetbrains',
        '@jetbrains/eslint-config/react',
        '@jetbrains/eslint-config/browser',
        'plugin:react-hooks/recommended',
    ),
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
            },
        },
        plugins: {
            'react-refresh': reactRefresh,
        },
        rules: {
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            "react/jsx-no-literals": "off",
            'max-len': [
                'error',
                {
                    code: 120,
                    ignoreComments: true,
                    ignoreTemplateLiterals: true,
                    ignoreRegExpLiterals: true,
                    ignorePattern: '"(?=([^"]|"){40,}")|\'(?=([^\']|\'){40,}\')',
                },
            ],
        },
    },
    {
        files: ["src/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            }
        }
    }
);
