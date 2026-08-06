import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [svelte()],
    server: {
      host: '0.0.0.0',
      allowedHosts: [env.VITE_ALLOWED_HOSTS],
      watch: {
        usePolling: true,
      }
    },
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
  }
})
