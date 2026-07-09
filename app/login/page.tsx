// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState<string>('');
  // 🐛 デバッグ用にエラーメッセージを文字列で管理
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // 🔑 ログイン認証処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // エラー表示をリセット

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      // レスポンスのJSONデータを取得を試みる
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPassword('');
        setErrorMessage(null);
        // ログイン成功したらトップページ（/）へ移動
        router.push('/');
        router.refresh();
      } else {
        // パスワード間違い、またはサーバー側でエラーを返した場合
        const detail = data.message || data.error || '不明なエラー';
        setErrorMessage(`⚠️ 認証失敗 (Status: ${res.status}): ${detail}`);
      }
    } catch (err: any) {
      // ネットワーク切断やAPIエンドポイントが存在しない場合など
      setErrorMessage(`🚨 通信エラー: ${err.message || 'サーバーに接続できません'}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '40px' }}>🔐</span>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 4px', color: '#222' }}>Waic Calculator</h2>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>パスワードを入力してください</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: errorMessage ? '1px solid #df4759' : '1px solid #ced4da', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#f8f9fa', outline: 'none', textAlign: 'center' }}
            autoFocus
          />
          
          {/* 🐛 一時的なデバッグ用エラー表示エリア */}
          {errorMessage && (
            <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecdd3', padding: '10px', borderRadius: '8px', color: '#df4759', fontSize: '12px', fontWeight: 'bold', lineHeight: '1.4', wordBreak: 'break-all' }}>
              {errorMessage}
            </div>
          )}

          <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0070f3', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,112,243,0.2)' }}>
            認証
          </button>
        </form>
      </div>
    </div>
  );
}