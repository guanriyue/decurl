import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        configured: resolve(root, 'src/configured.tsx'),
        codec: resolve(root, 'src/codec.ts'),
        decode: resolve(root, 'src/decode.ts'),
        pagination: resolve(root, 'src/pagination/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,

    rolldownOptions: {
      external,
      output: {
        chunkFileNames: '_chunks/[name]-[hash].js',
      },
    },
  },
});
