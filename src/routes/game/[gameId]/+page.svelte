<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
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
  let myPlayerId = 0;
  let isGameOver = false;
  let lastMoveWasPass = false;

  // --- WebRTC関連の状態 ---
  let Peer = null; // ★ 1. Peerクラスを格納する変数を準備
  let peer;
  let connectionStatus = '未接続';
  let isHost = false;
  let signalToSend = '';
  let receivedSignal = '';

  // (算出プロパティは変更なし)
  $: svgSize = gameContainerWidth;
  $: boardSize = game ? game.size : 19;
  $: boardPixelSize = svgSize - PADDING * 2;
  $: cellPixelSize = boardSize > 1 ? boardPixelSize / (boardSize - 1) : 0;
  
  onMount(async () => {
    // ★ 処理の順番を修正
    try {
      // 1. 先にゲームオブジェクトを作成し、UIが表示されるようにする
      const urlParams = $page.url.searchParams;
      const size = parseInt(urlParams.get('boardSize') || '19', 10);
      game = new GoGame(size);

      // 2. その後、ブラウザ依存の処理（WebRTCライブラリの読み込み、sessionStorageの利用）を行う
      Peer = (await import('simple-peer')).default;

      if (sessionStorage.getItem('isHostForGame' + $page.params.gameId) === 'true') {
        isHost = true;
        myPlayerId = 1;
        connectionStatus = 'あなたがホストです。接続コードを生成してください。';
        sessionStorage.removeItem('isHostForGame' + $page.params.gameId);
      } else {
        isHost = false;
        myPlayerId = 2;
        connectionStatus = 'あなたがゲストです。ホストから貰った接続コードを貼り付けてください。';
      }
    } catch (e) {
      console.error("ページの初期化中にエラーが発生しました:", e);
      gameMessage = "ページの初期化中にエラーが発生しました。";
    }
  });

  function initializePeer() {
    // ★ 3. Peerが読み込まれているかチェック
    if (!Peer) {
      alert('対戦機能の初期化中です。少し待ってからもう一度お試しください。');
      return;
    }
    
    // (以下のinitializePeer内のロジックは変更なし)
    peer = new Peer({ initiator: isHost, trickle: false });

    peer.on('signal', data => {
      signalToSend = JSON.stringify(data);
      connectionStatus = '下のコードを相手に送ってください。';
    });
    
    peer.on('data', data => {
      const move = JSON.parse(data.toString());
      handleOpponentMove(move);
    });

    peer.on('connect', () => {
      connectionStatus = '接続完了！対局を開始できます。';
    });

    peer.on('close', () => {
      connectionStatus = '接続が切れました。';
      isGameOver = true;
    });

    if (!isHost && receivedSignal) {
      peer.signal(JSON.parse(receivedSignal));
    }
  }

  // (connectPeer, handlePlaceStone, handleAction, handleOpponentMove, endGame, getCoord, hoshiPointsなどの
  // 他のすべての関数とロジックは一切変更ありません)
  
  function connectPeer() {
    try {
      peer.signal(JSON.parse(receivedSignal));
      connectionStatus = '相手の返信待ち...';
    } catch (err) {
      connectionStatus = '無効な接続コードです。';
    }
  }

  function handlePlaceStone(x, y) {
    if (!game || isGameOver || currentPlayer !== myPlayerId) return;
    lastMoveWasPass = false;
    gameMessage = '';
    const result = game.placeStone(x, y, currentPlayer);
    if (result.success) {
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
    if (isGameOver || currentPlayer !== myPlayerId) return;
    peer.send(JSON.stringify({ type: actionType }));
    if (actionType === 'resign') {
      endGame({ winner: myPlayerId === 1 ? '白番' : '黒番', reason: '投了' });
    } else if (actionType === 'pass') {
      lastMoveWasPass = true;
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      game = game;
    }
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
  <div class="connection-box">
    <h3>対戦接続</h3>
    <p class="status">状態: <strong>{connectionStatus}</strong></p>
    
    {#if !peer}
      <button on:click={initializePeer}>{isHost ? '1. 接続コードを生成' : '1. 接続準備'}</button>
    {:else if !peer.connected}
      <div class="signal-area">
        <label for="signal-to-send">【コピー用】あなたの接続コード:</label>
        <textarea id="signal-to-send" readonly bind:value={signalToSend}></textarea>
        
        <label for="received-signal">【貼付用】相手の接続コード:</label>
        <input type="text" id="received-signal" placeholder="相手から貰ったコードをここに貼り付け" bind:value={receivedSignal}>
        <button on:click={connectPeer}>2. 接続する</button>
      </div>
    {/if}
  </div>

  {#if peer && peer.connected}
    <div class="player-info-area">
      <div class="player-box" class:active={currentPlayer === 2}>
        <span>{myPlayerId === 2 ? 'あなた (白)' : '相手 (白)'}</span>
        <span class="captures">ハマグリ: {game.captures[2]}</span>
      </div>
      <div class="player-box" class:active={currentPlayer === 1}>
        <span>{myPlayerId === 1 ? 'あなた (黒)' : '相手 (黒)'}</span>
        <span class="captures">ハマグリ: {game.captures[1]}</span>
      </div>
    </div>

    <div class="game-container" bind:clientWidth={gameContainerWidth}>
       </div>
    
    <div class="action-area">
      <button class="action-button" on:click={() => handleAction('pass')}>パス</button>
      <button class="action-button resign" on:click={() => handleAction('resign')}>投了</button>
    </div>
  {:else}
    <div class="game-placeholder">
      <p>相手との接続が完了すると、ここに碁盤が表示されます。</p>
    </div>
  {/if}
</div>
{/if}

<style>
  /* ...前回のスタイルに加えて、以下のスタイルを追加・修正... */
  .connection-box {
    background: #fff;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
  }
  .connection-box .status {
    padding: 0.5rem;
    background-color: #f0f0f0;
    border-radius: 4px;
  }
  .signal-area { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;}
  .signal-area textarea, .signal-area input { font-family: monospace; width: 100%; padding: 0.5rem; }
  .signal-area button { margin-top: 0.5rem; }
  .game-placeholder { text-align: center; padding: 4rem 1rem; color: #777; }
  /* ...他のスタイルは前回から流用... */
</style>