module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 13,
        'sourceType': 'module',
        'ecmaFeatures': {
            'impliedStrict': true,
        },
    },
    'plugins': [
        '@typescript-eslint',
    ],
    'rules': {
        'indent': [
            'error',
            4,
        ],
        'linebreak-style': [
            'error',
            'unix',
        ],
        'quotes': [
            'error',
            'single',
        ],
        'semi': [
            'error',
            'never',
        ],
        'comma-dangle': [
            'error',
            {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            },
        ],
    },
}
