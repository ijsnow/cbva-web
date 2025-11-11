import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"
// import { nitro } from "nitro/vite"
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin"

// import { visualizer } from "rollup-plugin-visualizer"

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitroV2Plugin({ compatibilityDate: '2025-11-11', preset: "vercel" }),
    // visualizer({
    //   emitFile: true,
    //   filename: "stats.html",
    //   template: "network",
    // }),
  ],
})

export default config
