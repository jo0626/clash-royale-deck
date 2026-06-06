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
