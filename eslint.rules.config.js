import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ["**/*.rules"],
    plugins: {
      "@firebase/security-rules": firebaseRulesPlugin,
    },
    rules: {
      "@firebase/security-rules/exp-no-allow-list-isSignedIn": "error",
    },
  },
];
