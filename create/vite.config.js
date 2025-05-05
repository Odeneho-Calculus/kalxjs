import { defineConfig } from 'vite'
import { vitePlugin } from '@kalxjs-framework/compiler-sfc'

export default defineConfig({
    plugins: [vitePlugin()],
    server: {
        port: 5173,
        strictPort: true,
        open: true
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
})