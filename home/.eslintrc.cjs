/**
 * ESLint Configuration - Enhanced for Long-term Maintainability
 * 
 * This config prevents common issues through comprehensive rule enforcement:
 * 
 * 1. Bug Prevention: Catches async/await issues, unreachable code, infinite loops
 * 2. Modern JavaScript: Enforces ES6+ features (const, arrow functions, template literals)
 * 3. React Best Practices: Component patterns, hooks rules, performance optimization
 * 4. Accessibility: WCAG 2.1 AA compliance checks
 * 5. Import Management: Organized imports, no circular dependencies
 * 6. Code Quality: Consistent patterns, no unused code, proper returns
 * 
 * Goal: Minimize future maintenance issues through automatic enforcement
 */

module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '_site/',
    '.vite/',
    '.cache/',
    '.parcel-cache/',
    'coverage/',
    'public/',
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'prettier', // Must be last to override other configs
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y', 'import'],
  overrides: [
    {
      // Test files configuration
      files: ['**/*.test.{js,jsx}', '**/test/**/*.{js,jsx}'],
      env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true, // Provides globals
      },
      globals: {
        global: 'writable',
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  ],
  rules: {
    // ===================================
    // General JavaScript Rules
    // ===================================
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'prefer-destructuring': ['warn', {
      array: false,
      object: true,
    }],
    'object-shorthand': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-nested-ternary': 'warn',

    // ===================================
    // Bug Prevention
    // ===================================
    'no-await-in-loop': 'warn',
    'no-constant-binary-expression': 'error',
    'no-constructor-return': 'error',
    'no-promise-executor-return': 'error',
    'no-self-compare': 'error',
    'no-template-curly-in-string': 'warn',
    'no-unmodified-loop-condition': 'error',
    'no-unreachable-loop': 'error',
    'no-unused-private-class-members': 'error',
    'require-atomic-updates': 'error',
    'use-isnan': 'error',
    'valid-typeof': ['error', { requireStringLiterals: true }],
    'no-compare-neg-zero': 'error',
    'no-cond-assign': ['error', 'always'],
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-dupe-args': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty-character-class': 'error',
    'no-ex-assign': 'error',
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-obj-calls': 'error',
    'no-setter-return': 'error',
    'no-sparse-arrays': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': ['error', { disallowArithmeticOperators: true }],

    // ===================================
    // Best Practices
    // ===================================
    'array-callback-return': ['error', { allowImplicit: true }],
    'block-scoped-var': 'error',
    'consistent-return': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'dot-notation': 'error',
    'grouped-accessor-pairs': 'error',
    'no-alert': 'warn',
    'no-caller': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    'no-empty-function': 'warn',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-floating-decimal': 'error',
    'no-implicit-coercion': 'warn',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-proto': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-script-url': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unneeded-ternary': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': 'error',
    'radix': 'error',
    'require-await': 'warn',
    'yoda': 'error',

    // ===================================
    // ES6+ Features
    // ===================================
    'arrow-body-style': ['error', 'as-needed'],
    'no-duplicate-imports': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-const': 'error',
    'prefer-destructuring': ['warn', { 
      array: false, 
      object: true 
    }],
    'prefer-numeric-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    'symbol-description': 'error',

    // ===================================
    // React Refresh (Vite)
    // ===================================
    'react-refresh/only-export-components': ['off'],

    // ===================================
    // React Rules
    // ===================================
    'react/prop-types': 'off', // Turn on if using PropTypes
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    
    // JSX Specific
    'react/jsx-no-target-blank': ['error', { 
      allowReferrer: false,
      enforceDynamicLinks: 'always',
    }],
    'react/jsx-curly-brace-presence': ['error', { 
      props: 'never', 
      children: 'never',
    }],
    'react/self-closing-comp': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-sort-props': ['warn', {
      callbacksLast: true,
      shorthandFirst: true,
      ignoreCase: true,
      reservedFirst: true,
    }],
    'react/jsx-pascal-case': 'error',
    'react/jsx-key': ['error', { 
      checkFragmentShorthand: true,
      checkKeyMustBeforeSpread: true,
      warnOnDuplicates: true,
    }],
    'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-script-url': 'error',
    'react/jsx-fragments': ['error', 'syntax'],
    
    // Component Best Practices
    'react/function-component-definition': ['error', {
      namedComponents: 'function-declaration',
      unnamedComponents: 'arrow-function',
    }],
    'react/no-array-index-key': 'warn',
    'react/no-children-prop': 'error',
    'react/no-danger': 'warn',
    'react/no-danger-with-children': 'error',
    'react/no-deprecated': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-redundant-should-component-update': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-this-in-sfc': 'error',
    'react/no-unescaped-entities': 'error',
    'react/no-unknown-property': 'error',
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    'react/no-unused-state': 'error',
    'react/prefer-stateless-function': 'error',
    'react/style-prop-object': 'error',
    'react/void-dom-elements-no-children': 'error',
    
    // Performance
    'react/jsx-no-bind': ['warn', {
      allowArrowFunctions: true,
      allowBind: false,
      ignoreRefs: true,
    }],

    // ===================================
    // React Hooks Rules (Strict)
    // ===================================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['error', {
      additionalHooks: '(useCustomHook|useAnotherHook)', // Adjust if you add custom hooks
      enableDangerousAutofixThisMayCauseInfiniteLoops: false,
    }],

    // ===================================
    // Accessibility Rules (WCAG 2.1 AA Compliance)
    // ===================================
    // Semantic HTML & ARIA
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['to'],
      aspects: ['invalidHref', 'preferButton'],
    }],
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    
    // Interactive Elements
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    
    // Focus Management
    'jsx-a11y/no-autofocus': ['warn', { ignoreNonDOM: true }],
    'jsx-a11y/tabindex-no-positive': 'error',
    'jsx-a11y/no-access-key': 'error',
    
    // Images & Media
    'jsx-a11y/alt-text': ['error', {
      elements: ['img', 'object', 'area', 'input[type="image"]'],
      img: ['Image', 'OptimizedImage'],
    }],
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/media-has-caption': 'warn',
    
    // Forms
    'jsx-a11y/label-has-associated-control': ['error', {
      assert: 'either',
    }],
    'jsx-a11y/autocomplete-valid': 'error',
    
    // Headings & Structure
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/lang': 'error',
    
    // Misc Accessibility
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/scope': 'error',

    // ===================================
    // Import Rules
    // ===================================
    'import/order': ['error', {
      'groups': [
        'builtin',   // Node.js built-ins
        'external',  // npm packages
        'internal',  // Absolute imports
        'parent',    // ../
        'sibling',   // ./
        'index',     // ./index
      ],
      'pathGroups': [
        {
          pattern: 'react',
          group: 'external',
          position: 'before',
        },
        {
          pattern: 'react-**',
          group: 'external',
          position: 'before',
        },
      ],
      'pathGroupsExcludedImportTypes': ['react'],
      'newlines-between': 'always',
      'alphabetize': {
        order: 'asc',
        caseInsensitive: true,
      },
    }],
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 'warn',
    'import/no-named-as-default-member': 'warn',
    'import/newline-after-import': 'error',
    'import/first': 'error',
    'import/no-anonymous-default-export': ['error', {
      allowArray: false,
      allowArrowFunction: false,
      allowAnonymousClass: false,
      allowAnonymousFunction: false,
      allowLiteral: false,
      allowObject: true, // Allow export default { ... } for configs
    }],
    'import/no-webpack-loader-syntax': 'error',
    'import/no-self-import': 'error',
    'import/no-cycle': ['error', { maxDepth: 10 }],
    'import/no-useless-path-segments': 'error',
    'import/no-relative-packages': 'error',
    'import/no-mutable-exports': 'error',
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
    }],
  },
  overrides: [
    {
      // Allow console in config files
      files: ['*.config.js', '*.config.cjs', 'vite.config.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Entry point file can have non-export components
      files: ['src/main.jsx', 'src/main.js'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Relax rules for test files
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
