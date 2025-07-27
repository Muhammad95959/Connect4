import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        createGame: resolve(__dirname, 'createGame.html'),
        joinGame: resolve(__dirname, 'joinGame.html'),
        game: resolve(__dirname, 'game.html'),
      },
    },
  },
})
