<svelte:head>
  <title>いごたま - 友達とオンライン囲碁対戦</title>
  <meta name="description" content="「いごたま」は、友達と手軽にオンラインで囲碁を楽しめるウェブアプリです。面倒な登録は不要で、すぐに招待して対局を始められます。" />
</svelte:head>

<div class="top-page-container">
  <section class="hero-section">
    <h2>友達と、いつでもどこでも。</h2>
    <p class="subtitle">面倒な登録なしで、すぐに囲碁を始めよう。</p>
    <a href="/play" class="start-button">対局する</a>
  </section>

  <section class="about-section">
    <h3>「いごたま」について</h3>
    <p>
      「いごたま」は、友人との対局をとことん楽しむために作られたオンライン囲碁アプリです。
      見知らぬ人との対戦（野良対戦）がメインの他のサイトとは違い、友達を招待してすぐに対局できる手軽さを一番に考えました。
      まるで、友達グループの「デジタルな碁会所」のように、いつでも気軽に集まって囲碁を楽しんでください。
    </p>
  </section>
</div>

<style>
  .top-page-container {
    display: flex;
    flex-direction: column;
    gap: 2.5rem; /* セクション間の余白 */
  }

  .hero-section {
    text-align: center;
    padding: 3rem 1rem;
    background-color: #fff;
    border-radius: 12px;
  }

  h2 {
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    font-size: 1rem;
    color: #666;
    margin: 0 0 2rem 0;
  }

  .start-button {
    display: inline-block;
    padding: 1rem 2.5rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(45deg, #ff9b21, #ffb861); /* 少し温かみのあるオレンジ系 */
    border: none;
    border-radius: 50px;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .start-button:hover,
  .start-button:focus {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .about-section {
    padding: 2rem;
    background-color: #fff;
    border-radius: 12px;
    line-height: 1.8;
  }

  .about-section h3 {
    font-size: 1.3rem;
    font-weight: bold;
    text-align: center;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #ffb861;
    display: table; /* 中央寄せのため */
    margin-left: auto;
    margin-right: auto;
  }

  .about-section p {
    margin: 0;
    color: #444;
  }
  
  /* モバイルファースト設計：画面幅が480px以下の場合のスタイル */
  @media (max-width: 480px) {
    h2 {
        font-size: 1.5rem;
    }
    .start-button {
        padding: 0.8rem 2rem;
        font-size: 1.1rem;
    }
    .about-section {
        padding: 1.5rem;
    }
  }
</style>