// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Token from './components/Token';
import Tournament from './components/Tournament';
import Player from './components/Player';
import Probability from './components/Probability';
import Minigame from './components/Minigame';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<boolean>(false);

  const [activeMode, setActiveMode] = useState<number>(1);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // ✨ 改修：各モードに個別のサブアイコン画像（subIcon1～5）を割り当て、暇つぶしモードを追加
  const modes = [
    { id: 1, name: 'トークン', icon: '/Images/subIcon1.png' },
    { id: 2, name: 'トーナメント表', icon: '/Images/subIcon2.png' },
    { id: 3, name: 'プレイヤーデータ', icon: '/Images/subIcon3.png' },
    { id: 4, name: '確率計算', icon: '/Images/subIcon4.png' },
    { id: 5, name: 'ミニゲーム', icon: '/Images/subIcon5.png' },
  ];

  // 🔄 起動時に現在のクッキーから状態チェック
  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // 🔑 ログイン認証処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  // 🚪 ログアウト処理
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      setIsAuthenticated(false);
      setIsMenuOpen(false);
    }
  };

  const currentModeName = modes.find(m => m.id === activeMode)?.name || '';

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#888', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        読み込み中...
      </div>
    );
  }

  // 🔒 未ログイン時の画面
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src="/Images/Icon.png"
              alt="App Icon"
              style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', margin: '0 auto' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 4px', color: '#222' }}>Waic app Login</h2>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>パスワードを入力してください</p>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: authError ? '1px solid #df4759' : '1px solid #ced4da', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#f8f9fa', outline: 'none', textAlign: 'center' }}
              autoFocus
            />
            {authError && <p style={{ color: '#df4759', fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px', textAlign: 'center' }}>⚠️ パスワードが正しくありません</p>}
            <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0070f3', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,112,243,0.2)' }}>
              認証
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 📱 ログイン済みのメイン画面
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', color: '#333', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, height: '60px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: '24px', height: '18px', padding: 0 }}>
          <span style={{ width: '100%', height: '2px', backgroundColor: '#333' }} />
          <span style={{ width: '100%', height: '2px', backgroundColor: '#333' }} />
          <span style={{ width: '100%', height: '2px', backgroundColor: '#333' }} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{currentModeName}</h1>
        <div style={{ width: '24px' }} />
      </header>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 140 }} />}
      
      <nav style={{ 
        position: 'fixed', top: 0, left: isMenuOpen ? 0 : '-280px', bottom: 0, width: '280px', backgroundColor: '#fff', zIndex: 150, 
        transition: 'left 0.3s ease', padding: '24px 16px', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' 
      }}>
        
        {/* ブランドロゴエリア */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
          <img 
            src="/Images/Icon.png" 
            alt="Waic App Icon" 
            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain' }} 
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#111' }}>Waic app(β)</h2>
        </div>

        {/* モード切り替えボタン一覧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {modes.map((mode) => (
            <button 
              key={mode.id} 
              onClick={() => { setActiveMode(mode.id); setIsMenuOpen(false); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '12px 14px', border: 'none', borderRadius: '8px', fontSize: '15px', backgroundColor: activeMode === mode.id ? '#e6f0fa' : 'transparent', color: activeMode === mode.id ? '#0070f3' : '#333', fontWeight: activeMode === mode.id ? 'bold' : 'normal', cursor: 'pointer', textAlign: 'left' }}
            >
              {/* ✨ 修正：各固有アイコンの読み込みと、サイズを 24px × 24px に拡大 */}
              <img 
                src={mode.icon} 
                alt="" 
                style={{ width: '28px', height: '28x', objectFit: 'contain', flexShrink: 0 }} 
                onError={(e) => { (e.target as HTMLElement).style.visibility = 'hidden'; }}
              />
              {mode.name}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#fff5f5', color: '#e53e3e', cursor: 'pointer' }}>
          <span>🚪</span>ログアウト
        </button>
      </nav>

      <main style={{ padding: '8px', maxWidth: '480px', margin: '0 auto' }}>
        {activeMode === 1 && <Token />}
        {activeMode === 2 && <Tournament />}
        {activeMode === 3 && <Player />}
        {activeMode === 4 && <Probability />}
        {activeMode === 5 && <Minigame />}
      </main>
    </div>
  );
}