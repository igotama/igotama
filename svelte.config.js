import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-vercel'; // ★ 1. この行をインポート

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // ★ 2. adapterの設定を以下のように変更
    adapter: adapter() 
  }
};

export default config;