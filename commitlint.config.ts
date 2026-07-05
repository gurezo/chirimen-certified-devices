export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['workspace', 'devices', 'data', 'generated', 'schema', 'tools', 'ci'],
    ],
  },
};
