import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@vecells/design-system": fileURLToPath(
        new URL("../../packages/design-system/src/index.tsx", import.meta.url),
      ),
    },
    dedupe: ["react", "react-dom"],
  },
});
