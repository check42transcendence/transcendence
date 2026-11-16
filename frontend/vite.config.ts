import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Backend address for REST API and Socket.IO
const backendTarget =
	process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': backendTarget,
			'/socket.io': {
				target: backendTarget,
				ws: true,
			},
		},
	},
})