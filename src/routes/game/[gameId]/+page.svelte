<script>
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { GoGame } from '$lib/gameLogic.js';
  import { goto } from '$app/navigation';
  import { gameResult } from '$lib/stores.js';

  // --- 定数 ---
  const PADDING = 30;

  // --- ゲーム状態 ---
  let game = null;
  let currentPlayer = 1;
  let gameMessage = '';
  let gameContainerWidth = 0;
  let myPlayerId = 0; // 自分が黒(1)か白(2)か
  let isGameOver = false;
  let lastMoveWasPass = false;

  // --- WebRTC関連の状態 ---
  let Peer = null;
  let peer;
  let connectionStatus = '準備中...';
  
  // --- その他 ---
  let pollingInterval; // 相手の情報を定期的にチェックするためのタイマー

  // --- Svelte算出プロパティ ---
  $: svgSize = gameContainerWidth;
  $: boardSize = game ? game.size : 19;
  $: boardPixelSize = svgSize - PADDING * 2;
  $: cellPixelSize = boardSize > 1 ? boardPixelSize / (boardSize - 1) : 0;
  
  // --- ライフサイクル関数 ---
  onMount(async () => {
    try {
      // 1. ゲームオブジェクトを初期化
      const urlParams = $page.url.searchParams;
      const size = parseInt(urlParams.get('boardSize') || '19', 10);
      game = new GoGame(size);
      
      // 2. WebRTCライブラリを読み込み
      Peer = (await import('simple-peer')).default;
      
      // 3. 自分がホストかゲストかを判定
      const isHost = sessionStorage.getItem('isHostForGame' + $page.params.gameId) === 'true';
      sessionStorage.removeItem('isHostForGame' + $page.params.gameId);
      myPlayerId = isHost ? 1 : 2;
      
      // 4. Peerオブジェクトを初期化し、イベントハンドラを設定
      peer = new Peer({ initiator: isHost, trickle: false });
      
      peer.on('signal', signalData => {
        // 接続情報が生成されたら、サーバーの郵便受け(API)に送信
        if (!peer.connected) {
          fetch('/api/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: $page.params.gameId, signalData })
          });
        }
      });
      
      peer.on('connect', () => {
        connectionStatus = '接続完了！';
        if (pollingInterval) clearInterval(pollingInterval);
      });
      
      peer.on('data', data => handleOpponentMove(JSON.parse(data.toString())));
      peer.on('close', () => { connectionStatus = '接続が切れました'; isGameOver = true; });

      // 5. 相手の接続情報をサーバーに問い合わせ開始
      startPolling(isHost);

    } catch (e) {
      console.error("ページの初期化エラー:", e);
      connectionStatus = "ページの初期化中にエラーが発生しました。";
    }
  });

  onDestroy(() => {
    // ページを離れるときに、不要なチェックが動かないように停止する
    if (pollingInterval) clearInterval(pollingInterval);
  });
  
  // --- 関数定義 ---
  function startPolling(isHost) {
    connectionStatus = '対戦相手を待っています...';
    pollingInterval = setInterval(async () => {
      if (peer.connected) {
        clearInterval(pollingInterval);
        return;
      }
      const res = await fetch(`/api/signal?gameId=${$page.params.gameId}`);
      const { signalData } = await res.json();
      
      if (signalData) {
        // 自分が出した情報でなければ、接続を試みる
        if (isHost && signalData.type === 'answer') {
          peer.signal(signalData);
        } else if (!isHost && signalData.type === 'offer') {
          peer.signal(signalData);
        }
      }
    }, 3000); // 3秒ごとに郵便受けをチェック
  }

  function handlePlaceStone(x, y) {
    if (!game || isGameOver || !peer.connected || currentPlayer !== myPlayerId) return;
    
    gameMessage = '';
    const result = game.placeStone(x, y, currentPlayer);

    if (result.success) {
      lastMoveWasPass = false;
      const move = { type: 'stone', x, y };
      peer.send(JSON.stringify(move));
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    } else {
      gameMessage = result.message;
      setTimeout(() => gameMessage = '', 3000);
    }
    game = game;
  }
  
  function handleAction(actionType) {
    if (isGameOver || !peer.connected || currentPlayer !== myPlayerId) return;
    
    peer.send(JSON.stringify({ type: actionType }));
    
    if (actionType === 'resign') {
      endGame({ winner: myPlayerId === 1 ? '白番' : '黒番', reason: '投了' });
    } else if (actionType === 'pass') {
      if (lastMoveWasPass) {
        const score = game.calculateScore();
        endGame({ winner: score.winner, reason: `${score.difference}目差`, score });
      } else {
        lastMoveWasPass = true;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
      }
    }
    game = game;
  }

  function handleOpponentMove(move) {
    if (isGameOver) return;
    if (move.type === 'stone') {
      lastMoveWasPass = false;
      game.placeStone(move.x, move.y, currentPlayer);
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    } else if (move.type === 'resign') {
      endGame({ winner: myPlayerId, reason: '相手の投了' });
    } else if (move.type === 'pass') {
      if (lastMoveWasPass) {
        const score = game.calculateScore();
        endGame({ winner: score.winner, reason: `${score.difference}目差`, score });
      } else {
        lastMoveWasPass = true;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
      }
    }
    game = game;
  }

  function endGame(resultDetails) {
    if (isGameOver) return;
    isGameOver = true;
    if (pollingInterval) clearInterval(pollingInterval);
    
    gameResult.set({
      finalBoard: game.board,
      history: game.history,
      captures: game.captures,
      result: resultDetails,
      gameId: $page.params.gameId
    });

    goto(`/result/${$page.params.gameId}`);
  }

  function getCoord(index) {
    return PADDING + index * cellPixelSize;
  }
  
  $: hoshiPoints = (() => {
    if (!game) return [];
    const size = game.size;
    if (size === 19) {
      const points = [3, 9, 15];
      const newHoshi = [];
      points.forEach(x => points.forEach(y => newHoshi.push({ x, y })));
      return newHoshi;
    }
    if (size === 13) return [{x:6,y:6}, {x:3,y:3}, {x:3,y:9}, {x:9,y:3}, {x:9,y:9}];
    if (size === 9) return [{x:4,y:4}, {x:2,y:2}, {x:2,y:6}, {x:6,y:2}, {x:6,y:6}];
    return [];
  })();
</script>

{#if game}
<div class="game-page">
  <div class="player-info-area">
    <div class="player-box" class:active={currentPlayer === 2}>
      <span>{myPlayerId === 2 ? 'あなた (白)' : '相手 (白)'}</span>
      <span class="timer">10:00</span>
      <span class="captures">ハマグリ: {game.captures[2]}</span>
    </div>
    <div class="player-box" class:active={currentPlayer === 1}>
      <span>{myPlayerId === 1 ? 'あなた (黒)' : '相手 (黒)'}</span>
      <span class="timer">10:00</span>
      <span class="captures">ハマグリ: {game.captures[1]}</span>
    </div>
  </div>

  <div class="game-container" bind:clientWidth={gameContainerWidth}>
    {#if gameContainerWidth > 0}
    <div class="game-board-wrapper">
      <svg width={svgSize} height={svgSize} class="goban-svg">
        <rect x="0" y="0" width={svgSize} height={svgSize} fill="#f3d39c" />

        <g class="lines">
          {#each Array(boardSize) as _, i}
            <line 
              x1={getCoord(i)} y1={PADDING} 
              x2={getCoord(i)} y2={svgSize - PADDING} 
              stroke="#5c3e0a" stroke-width="1" />
            <line 
              x1={PADDING} y1={getCoord(i)} 
              x2={svgSize - PADDING} y2={getCoord(i)} 
              stroke="#5c3e0a" stroke-width="1" />
          {/each}
        </g>
        
        <g class="hoshi">
          {#each hoshiPoints as point}
            <circle cx={getCoord(point.x)} cy={getCoord(point.y)} r={cellPixelSize * 0.15} fill="#5c3e0a" />
          {/each}
        </g>

        <g class="stones">
          {#each game.board as row, y}
            {#each row as cell, x}
              {#if cell === 1}
                <circle cx={getCoord(x)} cy={getCoord(y)} r={cellPixelSize * 0.47} fill="black" />
              {:else if cell === 2}
                <circle cx={getCoord(x)} cy={getCoord(y)} r={cellPixelSize * 0.47} fill="white" stroke="black" stroke-width="0.5" />
              {/if}
            {/each}
          {/each}
        </g>

        <g class="click-grid">
          {#each Array(boardSize) as _, y}
            {#each Array(boardSize) as _, x}
              <rect 
                x={getCoord(x) - cellPixelSize / 2} 
                y={getCoord(y) - cellPixelSize / 2}
                width={cellPixelSize} height={cellPixelSize}
                fill="transparent" 
                on:click={() => handlePlaceStone(x, y)} 
              />
            {/each}
          {/each}
        </g>
      </svg>
    </div>
    {/if}
  </div>
  
  <div class="action-area">
    <button class="action-button" on:click={() => handleAction('pass')}>パス</button>
    <button class="action-button resign" on:click={() => handleAction('resign')}>投了</button>
  </div>

  {#if myPlayerId === 2 && !(peer && peer.connected)}
    <div class="waiting-overlay">
      <div class="connection-box">
        <h3>対戦接続</h3>
        <p class="status">状態: <strong>{connectionStatus}</strong></p>
        <p>ホストに接続しています。しばらくお待ちください...</p>
      </div>
    </div>
  {/if}

</div>
{:else}
  <div class="loading-placeholder">
    <p>対局を読み込んでいます...</p>
  </div>
{/if}

<style>
  .game-page { position: relative; display: flex; flex-direction: column; height: 100%; }
  .player-info-area { display: flex; justify-content: space-between; padding: 0.5rem; gap: 0.5rem; }
  .player-box { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0.8rem; background-color: #f0f0f0; border-radius: 8px; border: 2px solid transparent; transition: all 0.3s; }
  .player-box.active { border-color: #ff9b21; box-shadow: 0 0 10px rgba(255, 155, 33, 0.5); }
  .player-box .timer { font-size: 1.2rem; font-weight: bold; }
  .player-box .captures { font-size: 0.8rem; color: #555; }
  .game-container { width: 100%; max-width: 800px; margin: 0 auto; aspect-ratio: 1 / 1; }
  .game-board-wrapper { position: relative; width: 100%; height: 100%; }
  .goban-svg { cursor: pointer; touch-action: none; }
  .action-area { display: flex; justify-content: center; gap: 1rem; padding: 1rem; }
  .action-button { padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; background-color: #e0e0e0; transition: background-color 0.2s; }
  .action-button:hover { background-color: #ccc; }
  .action-button.resign { background-color: #e57373; color: white; }
  .action-button.resign:hover { background-color: #ef5350; }
  .loading-placeholder { text-align: center; padding: 4rem 1rem; color: #777; }
  .waiting-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; text-align: center; z-index: 10; }
  .connection-box { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
</style>