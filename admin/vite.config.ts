import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/admin/',
    server: {
        port: 3004,
        proxy: {
            '/api': 'http://localhost:3005'
        }
    }
})
