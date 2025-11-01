import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../utils';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    replace({
      __DEV__: true,
      preventAssignment: true
    })
  ],
  resolve: {
    alias: [
      {
        find: 'react',
        replacement: resolvePkgPath('react')
      },
      {
        find: 'react-dom',
        replacement: resolvePkgPath('react-dom')
      },
      {
        find: 'HostConfig',
        replacement: path.resolve(resolvePkgPath('react-dom'), './src/HostConfig.ts')
      }
    ]
  }
});
