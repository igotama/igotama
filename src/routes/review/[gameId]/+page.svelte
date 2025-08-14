<script>
  import { gameResult } from '$lib/stores.js';
  import { onMount } from 'svelte';
  
  let reviewData = null;
  let currentMove = 0;
  let displayedBoard = [];

  $: if(reviewData) {
    // スライダーが動くと、この部分が再実行されて盤面が更新される
    displayedBoard = JSON.parse(reviewData.history[currentMove]);
  }

  // SGF形式の棋譜データを生成する関数
  function exportSGF() {
    // ... (SGF生成ロジックは長くなるため、別途実装)
    alert('SGFエクスポート機能は準備中です！');
  }

  function shareOnX() {
    const text = `囲碁アプリ「いごたま」で対局しました！ #いごたま`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${window.location.href}`;
    window.open(url, '_blank');
  }

  onMount(() => {
    // ... 結果ページと同様にストアからデータを読み込む ...
  });
</script>

<svelte:head>
  <title>棋譜再生 - いごたま</title>
</svelte:head>

{#if reviewData}
<div class="review-container">
  <h1>棋譜再生</h1>
  <pre>{JSON.stringify(displayedBoard, null, 2)}</pre>

  <div class="controls">
    <label for="kifu-slider">手数: {currentMove} / {reviewData.history.length - 1}</label>
    <input 
      type="range" 
      id="kifu-slider"
      min="0"
      max={reviewData.history.length - 1}
      bind:value={currentMove}
    />
  </div>
  
  <div class="action-buttons">
    <button on:click={shareOnX}>Xで共有</button>
    <button on:click={exportSGF}>SGFエクスポート</button>
  </div>
</div>
{/if}

<style>
  /* スタイルをここに記述 */
</style>