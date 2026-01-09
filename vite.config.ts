import { sentryVitePlugin } from "@sentry/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

// import { visualizer } from "rollup-plugin-visualizer"

const config = defineConfig({
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // visualizer({
    //   emitFile: true,
    //   filename: "stats.html",
    //   template: "network",
    // }),
    nitro(), // { compatibilityDate: '2025-11-11', preset: "vercel" }),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "isaac-snow",
      project: "cbva-vercel",
    }),
  ],
  nitro: {
    compatibilityDate: "latest",
    preset: "vercel",
  },
})

export default config
