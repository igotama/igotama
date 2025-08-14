<script>
  // 作成したグローバルCSSをインポートします
  import '../app.css';
</script>

<div class="app-container">
  <header>
    <a href="/" class="logo-link">
      <span class="logo-text">いごたま</span>
    </a>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <div class="footer-content">
      <div class="footer-info">
        <p class="app-name">いごたま</p>
        <p class="developer">開発元: XxxX</p>
      </div>
      <div class="footer-links">
        <a href="#contact">お問い合わせ</a>
        <a href="#privacy">プライバシーポリシー</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh; /* 画面の高さいっぱいに表示 */
    width: 100%;
    max-width: 800px; /* PCでも見やすいように最大幅を設定 */
    margin: 0 auto;
    background-color: #f9f9f9;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }

  header {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: #fff;
    border-bottom: 1px solid #eee;
  }

  .logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #333;
  }

  .logo {
    height: 40px;
    margin-right: 0.5rem;
  }
  
  .logo-text {
    font-size: 1.5rem;
    font-weight: bold;
  }

  main {
    flex-grow: 1; /* この要素が伸びてフッターを一番下に押しやります */
    padding: 1rem;
  }

  footer {
    padding: 2rem 1rem;
    background-color: #333;
    color: #fff;
    font-size: 0.8rem;
  }
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-links a {
    color: #fff;
    text-decoration: none;
    margin-left: 1rem;
  }

  .footer-links a:hover {
    text-decoration: underline;
  }

  /* モバイルファースト設計：画面幅が480px以下の場合のスタイル */
  @media (max-width: 480px) {
    main {
      padding: 0.8rem;
    }
    .footer-content {
      flex-direction: column;
      gap: 1rem;
    }
    .footer-links {
      display: flex;
      gap: 1.5rem;
    }
    .footer-links a {
      margin-left: 0;
    }
  }
</style>