import { defineConfig } from "vite";
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(`v${process.env.npm_package_version ?? '0.1.0'} · ${process.env.GITHUB_SHA?.slice(0,7) ?? 'dev'}`),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          toss: ["@apps-in-toss/web-framework"],
        },
      },
    },
  },
});
