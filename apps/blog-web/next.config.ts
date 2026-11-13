import type { NextConfig } from 'next';
const config: NextConfig = {
    poweredByHeader: false,
    experimental: { useTypeScriptCli: false },
    // Resolve article metadata (including notFound) before sending headers for ALL
    // user agents. No article-ancestor loading.tsx or Suspense may flush a 200 first.
    htmlLimitedBots: /.*/,
};
export default config;
