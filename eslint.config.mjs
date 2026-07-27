import next from 'eslint-config-next';

/** eslint-config-next từ v16 đã hỗ trợ flat config gốc, không cần FlatCompat. */
const config = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default config;
