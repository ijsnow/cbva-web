// // vitest.config.ts
// import { defineConfig } from 'vitest/config';
// import * as path from 'path'

// export default defineConfig({
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src')
//     },
//   },
//   test: {
//     globals: true, // Use Vitest globals (describe, it, etc.)
//     setupFiles: ["./src/testing/db-setup"], // Optional: setup files for tests
//     environment: 'node', // Specify Node environment
//     // Increase timeout for container startup, snapshotting etc.
//     testTimeout: 60000, // 60 seconds
//     hookTimeout: 60000, // 60 seconds for hooks too
//   },
// });

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
	  include: ['./src/**/*.test.ts?(x)'],

		// coverage: { provider: "istanbul" },
		setupFiles: ["src/tests/setup.integration.ts"],
	},
});
