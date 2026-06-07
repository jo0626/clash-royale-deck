// =============================================================
//  Firebase 設定ファイル（crdeckbuilders）
//  apiKey 等はウェブ用の公開キーなのでサイトに含めて問題ありません。
//  実際の保護は firestore.rules（セキュリティルール）で行います。
// =============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyAVz0Klb7HBq7cK6ITZBZW9DMSH7QevGZI",
  authDomain: "crdeckbuilders.firebaseapp.com",
  projectId: "crdeckbuilders",
  storageBucket: "crdeckbuilders.firebasestorage.app",
  messagingSenderId: "485125393098",
  appId: "1:485125393098:web:aa4b3508c1e825cb644233",
  measurementId: "G-N19CVY3C3K"
};

// 設定が未入力かどうかの判定（未設定ならログイン機能を無効化してサイトは普通に動く）
export const isConfigured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("ここに");

// ── クラロワID（プレイヤータグ）から所持カードを取得するエンドポイント ──
// 公式CR APIはトークン＋IP制限＋CORSのためブラウザから直叩き不可。
// GAS（Code.gs）に doGet(?tag=...) を用意して、その公開ウェブアプリURLをここに貼る。
// 返却JSONの想定: { "cards": ["ナイト","大砲", ...] }（日本語カード名）
// 空のうちは所持カード機能はオフ（サイトは普通に動く）。
export const crPlayerApiUrl = "https://script.google.com/macros/s/AKfycbwptf8Rh_6vXyMWxrVJoRD0IxQuEgadT5cy6Pk-r4i6_cZQAgYDmam8l5yO79kmwbXm/exec";
