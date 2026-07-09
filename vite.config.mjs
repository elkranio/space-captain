import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'src',
    base: './',
    publicDir: '../public',

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: path.resolve(__dirname, 'src/index.html'),
        },
    },

    server: {
        open: true,
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
