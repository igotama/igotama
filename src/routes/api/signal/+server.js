import { Redis } from '@upstash/redis';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Upstash Redisクライアントを初期化
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// データを取得する（GETリクエスト）
export async function GET({ url }) {
  const gameId = url.searchParams.get('gameId');
  if (!gameId) {
    return json({ error: 'gameId is required' }, { status: 400 });
  }

  const signalData = await redis.get(`signal:${gameId}`);
  return json({ signalData });
}

// データを保存する（POSTリクエスト）
export async function POST({ request }) {
  const { gameId, signalData } = await request.json();
  if (!gameId || !signalData) {
    return json({ error: 'gameId and signalData are required' }, { status: 400 });
  }

  // データを10分間だけ保存する
  await redis.set(`signal:${gameId}`, signalData, { ex: 600 });
  return json({ success: true });
}