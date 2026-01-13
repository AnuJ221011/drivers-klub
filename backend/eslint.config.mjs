
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
    {
        ignores: [
            "**/dist/**",
            "node_modules/**"
        ]
    },
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-undef": "off",
            "no-empty": "warn",
            "@typescript-eslint/ban-ts-comment": "off",
            "no-constant-condition": "warn",
            "@typescript-eslint/no-require-imports": "off"
        }
    }
];
