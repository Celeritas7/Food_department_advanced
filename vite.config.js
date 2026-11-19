import { defineConfig, loadEnv } from 'vite';
import publicConfig from './src/config/public-supabase.json';
import { resolveSupabaseConfig } from './src/config/resolveSupabase.js';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  resolveSupabaseConfig({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }, publicConfig);
  return {
  plugins: [react()],
  base: '/Food_department_advanced/',
  build: {
    outDir: 'docs',
    manifest: true,
    rolldownOptions: {
      output: {
        // Libraries change rarely; separate files stay cached across app updates
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
  };
});
