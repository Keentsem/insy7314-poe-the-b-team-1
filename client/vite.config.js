import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../config/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../config/cert.pem')),
    },
  },
});
