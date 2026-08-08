import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/getAllRooms": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/addRoom": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/addRoomsBulk": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/updateById": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/deleteRoomById": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
    },
  },
})
