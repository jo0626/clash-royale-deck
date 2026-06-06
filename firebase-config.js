// =============================================================
//  Firebase 設定ファイル
//  Firebase コンソールで取得した firebaseConfig をここに貼り付けてください。
//  取得方法は FIREBASE-SETUP.md を参照。
//
//  ▼ 貼り替えるのはこの { ... } の中身だけ ▼
// =============================================================
export const firebaseConfig = {
  apiKey: "ここにapiKey",
  authDomain: "ここにxxxx.firebaseapp.com",
  projectId: "ここにprojectId",
  storageBucket: "ここにxxxx.appspot.com",
  messagingSenderId: "ここに数字",
  appId: "ここにappId"
};

// 設定が未入力かどうかの判定（未設定ならログイン機能を無効化してサイトは普通に動く）
export const isConfigured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("ここに");
