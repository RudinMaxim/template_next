import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(path.dirname(import.meta.url), './src/app/style')],
    prependData: `
      @use 'global/variables' as globalVars;
      @use 'global/mixins'  as globalMixins;
    `,
  },
};

export default nextConfig;
