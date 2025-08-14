import { writable } from 'svelte/store';

// アプリ全体で共有したいデータをここに定義します
// gameResultは、対局結果をページ間で受け渡すために使います
export const gameResult = writable(null);