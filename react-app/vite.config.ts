import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/human-design-3d/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Allow importing files from the workspace root (one level above react-app/)
    fs: { allow: ['..'] },
  },
})
