/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // PGlite ships a WASM binary that must not be bundled by webpack.
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
