import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { copyFileSync } from "fs";

export default defineConfig({
  // Suppress source map warnings in development
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  plugins: [
    react(),
    // runtimeErrorOverlay(), // Temporarily disabled - causing React hooks conflicts
    // Copy staticwebapp.config.json to build output for Azure Static Web Apps
    {
      name: 'copy-staticwebapp-config',
      writeBundle() {
        const srcPath = path.resolve(import.meta.dirname, 'staticwebapp.config.json');
        const destPath = path.resolve(import.meta.dirname, 'dist/public/staticwebapp.config.json');
        try {
          copyFileSync(srcPath, destPath);
          console.log('✅ Copied staticwebapp.config.json to build output');
        } catch (error) {
          console.warn('⚠️ Failed to copy staticwebapp.config.json:', error);
        }
      }
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Improve source map handling in development
  css: {
    devSourcemap: true,
  },
  // Optimize dependencies to reduce source map warnings
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    exclude: [],
  },
});
