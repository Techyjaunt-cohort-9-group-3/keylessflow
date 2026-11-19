import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Port 3000 matches the API's default FRONTEND_URL and Paystack callback URL
  server: { port: 3000 },
})
