import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Output goes to dist/ (Vite default). GitHub Actions builds and deploys it;
// nothing build-related is committed to the repo.
export default defineConfig({
  plugins: [react()],
  base: '/Food_department_advanced/',
});
