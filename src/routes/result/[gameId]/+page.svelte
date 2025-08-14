<script>
  import { gameResult } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let resultData = null;

  onMount(() => {
    const unsub = gameResult.subscribe(value => {
      resultData = value;
    });
    // このページを直接リロードした場合などはデータがないのでトップに戻す
    if (!resultData) {
      goto('/');
    }
    return unsub;
  });
</script>

<svelte:head>
  <title>対局結果 - いごたま</title>
</svelte:head>

{#if resultData}
<div class="result-container">
  <h1>対局結果</h1>

  <div class="winner-announcement">
    <p>{resultData.result.reason}で</p>
    <h2>{resultData.result.winner}の勝ちです</h2>
  </div>
  
  {#if resultData.result.score}
    <div class="score-details">
      <p>黒: {resultData.result.score.black}目</p>
      <p>白: {resultData.result.score.white}目</p>
    </div>
  {/if}

  <div class="action-buttons">
    <a href="/review/{resultData.gameId}" class="button">棋譜を見る</a>
    <a href="/play" class="button">続けて対局する</a>
    <a href="/" class="button secondary">トップページへ</a>
  </div>
</div>
{/if}

<style>
  /* スタイルをここに記述 */
  .result-container { text-align: center; padding: 2rem; }
  .winner-announcement h2 { font-size: 2rem; color: #ff9b21; }
  .score-details { margin: 1rem 0; }
  .action-buttons { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; }
  .button { display: block; padding: 1rem 2rem; text-decoration: none; color: white; background-color: #ff9b21; border-radius: 8px; width: 80%; max-width: 300px;}
  .button.secondary { background-color: #777; }
</style>