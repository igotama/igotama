<script>
  import { goto } from '$app/navigation'; // ページ遷移のためのSvelteKitの機能をインポート

  // 各設定項目の初期値を保持する変数
  let boardSize = '19';
  let timeSetting = 'none';
  let mainTime = '10';
  let byoyomiTime = '30';
  let byoyomiCount = '3';
  let handicap = '0'; // 置き石。「0」は「なし」
  let komi = '6.5';
  let customKomi = 6.5;

  // 「対局開始」ボタンが押されたときに実行される関数
  async function createGame() {
    // 1. ユニークな対局IDを生成 (現在時刻 + 乱数で簡易的に)
    const gameId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // 2. 設定をURLパラメータとしてまとめる
    const params = new URLSearchParams();
    params.set('boardSize', boardSize);
    params.set('timeSetting', timeSetting);
    if (timeSetting === 'main_time') {
      params.set('mainTime', mainTime);
    }
    if (timeSetting === 'byoyomi') {
      params.set('byoyomiTime', byoyomiTime);
      params.set('byoyomiCount', byoyomiCount);
    }
    params.set('handicap', handicap);
    params.set('komi', komi === 'custom' ? customKomi.toString() : komi);

    // 3. 共有用の完全なURLを生成
    // window.location.origin は "http://localhost:5173" のような現在のドメイン部分
    const gameUrl = `${window.location.origin}/game/${gameId}?${params.toString()}`;

    // 対局ページのonMountで読み取れるように、sessionStorageにホストである印をつける
    sessionStorage.setItem('isHostForGame' + gameId, 'true');

    // 4. ポップアップでURLを知らせ、クリップボードにコピー
    try {
      await navigator.clipboard.writeText(gameUrl);
      alert(`対局URLをコピーしました！\n\n${gameUrl}\n\nこのURLを対戦相手に送ってください。\nOKを押すと対局画面に移動します。`);
    } catch (err) {
      // クリップボードAPIが使えない（http接続など）場合
      prompt('以下のURLをコピーして対戦相手に送ってください:', gameUrl);
    }

    // 5. 自身も対局ページへ移動
    goto(`/game/${gameId}?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>対局設定 - いごたま</title>
</svelte:head>

<div class="settings-container">
  <h1>対局設定</h1>

  <form on:submit|preventDefault={createGame}>
    
    <fieldset>
      <legend>碁盤サイズ</legend>
      <div class="radio-group">
        <label class:selected={boardSize === '19'}>
          <input type="radio" name="boardSize" value="19" bind:group={boardSize} /> 19路盤
        </label>
        <label class:selected={boardSize === '13'}>
          <input type="radio" name="boardSize" value="13" bind:group={boardSize} /> 13路盤
        </label>
        <label class:selected={boardSize === '9'}>
          <input type="radio" name="boardSize" value="9" bind:group={boardSize} /> 9路盤
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>時間設定</legend>
      <select bind:value={timeSetting}>
        <option value="none">なし</option>
        <option value="main_time">持ち時間制</option>
        <option value="byoyomi">秒読み</option>
        <option value="canadian" disabled>カナダ式 (実装予定)</option>
      </select>

      {#if timeSetting === 'main_time'}
        <div class="conditional-settings">
          <label for="mainTime">持ち時間:</label>
          <select id="mainTime" bind:value={mainTime}>
            <option value="5">5分</option>
            <option value="10">10分</option>
            <option value="30">30分</option>
          </select>
        </div>
      {/if}
      
      {#if timeSetting === 'byoyomi'}
        <div class="conditional-settings">
          <label for="byoyomiTime">秒読み:</label>
          <select id="byoyomiTime" bind:value={byoyomiTime}>
            <option value="30">30秒</option>
            <option value="60">60秒</option>
          </select>
          <select bind:value={byoyomiCount}>
            <option value="1">1回</option>
            <option value="3">3回</option>
            <option value="5">5回</option>
          </select>
        </div>
      {/if}
    </fieldset>

    <fieldset>
      <legend>置き石 (ハンデ)</legend>
      <select bind:value={handicap}>
        <option value="0">なし (互先)</option>
        <option value="2">2子</option>
        <option value="3">3子</option>
        <option value="4">4子</option>
        <option value="5">5子</option>
        <option value="6">6子</option>
        <option value="7">7子</option>
        <option value="8">8子</option>
        <option value="9">9子</option>
      </select>
    </fieldset>
    
    <fieldset>
      <legend>コミ</legend>
      <div class="radio-group">
        <label class:selected={komi === '6.5'}>
          <input type="radio" name="komi" value="6.5" bind:group={komi} /> 6目半
        </label>
        <label class:selected={komi === 'custom'}>
          <input type="radio" name="komi" value="custom" bind:group={komi} /> カスタム
        </label>
      </div>
      {#if komi === 'custom'}
        <div class="conditional-settings">
          <input type="number" step="0.5" bind:value={customKomi} /> 目
        </div>
      {/if}
    </fieldset>

    <button type="submit" class="start-button">対局を開始する</button>

  </form>
</div>

<style>
  .settings-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  fieldset {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    background-color: #fff;
  }
  legend {
    font-weight: bold;
    color: #555;
    padding: 0 0.5rem;
  }
  select, input[type="number"] {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  .radio-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .radio-group label {
    flex-grow: 1;
    text-align: center;
    padding: 0.8rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }
  /* ラジオボタン本体は隠す */
  .radio-group input[type="radio"] {
    display: none;
  }
  /* 選択されているラベルのスタイル */
  .radio-group label.selected {
    background-color: #ff9b21;
    color: white;
    border-color: #ff9b21;
    font-weight: bold;
  }
  .conditional-settings {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f7f7f7;
    padding: 1rem;
    border-radius: 4px;
  }
  .start-button {
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(45deg, #ff9b21, #ffb861);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    margin-top: 1rem;
  }
  .start-button:hover,
  .start-button:focus {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
</style>