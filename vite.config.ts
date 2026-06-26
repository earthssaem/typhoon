import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 프로토타입: 정적 배포(Vercel/GitHub Pages 등)를 고려해 base를 상대경로로 둔다.
export default defineConfig({
  base: './',
  plugins: [react()],
});
