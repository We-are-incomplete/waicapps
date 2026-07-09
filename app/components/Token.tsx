// app/components/Token.tsx
'use client';

import { useState } from 'react';

export default function Token() {
  // 初期状態（リセット時に使い回せるよう定義）
  const initialTokens = [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ];

  // 🪙 トークン用の状態
  const [columnsState, setColumnsState] = useState<boolean[][]>(initialTokens);

  // 🎲 サイコロ用の状態
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceResults, setDiceResults] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // ✨ 各列（colIndex）に対応するトークン画像のパス定義
  const tokenImages = [
    '/Images/Tokena.png', // 魔力α (colIndex: 0)
    '/Images/Tokenb.png', // 魔力β (colIndex: 1)
    '/Images/Tokeno.png', // 魔力Ω (colIndex: 2)
    '/Images/Tokenv.png', // VOL左 (colIndex: 3)
    '/Images/Tokenv.png', // VOL右 (colIndex: 4)
  ];

  const toggleToken = (colIndex: number, btnIndex: number) => {
    const newState = columnsState.map((col, cIdx) => 
      cIdx === colIndex ? col.map((btn, bIdx) => bIdx === btnIndex ? !btn : btn) : col
    );
    setColumnsState(newState);
  };

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setDiceResults([]);
    setTimeout(() => {
      const results = [];
      for (let i = 0; i < diceCount; i++) {
        results.push(Math.floor(Math.random() * 6) + 1);
      }
      setDiceResults(results);
      setIsRolling(false);
    }, 400);
  };

  const changeDiceCount = (delta: number) => {
    setDiceCount(prev => {
      const next = prev + delta;
      return next >= 1 && next <= 5 ? next : prev;
    });
  };

  // 🔄 トークンとサイコロの全リセット処理
  const handleResetAll = () => {
    if (window.confirm('トークンとサイコロの状態をすべてリセットしますか？')) {
      setColumnsState(initialTokens);
      setDiceResults([]);
      setDiceCount(1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 🪙 トークンエリア */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr 2fr', 
        gap: '8px',
        backgroundColor: '#fff',
        padding: '16px 8px', // ✨ テキスト削除に伴い、上下の余白バランスを調整
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {/* 単列セット (旧: 魔力α, 魔力β, 魔力Ω) */}
        {[0, 1, 2].map((colIndex) => (
          <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {/* ✨ 修正：テキストラベルを削除 */}
            {columnsState[colIndex].map((isOn, btnIndex) => (
              <button
                key={btnIndex}
                onClick={() => toggleToken(colIndex, btnIndex)}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                  backgroundImage: `url(${tokenImages[colIndex]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: isOn ? 'transparent' : '#f0f0f0',
                  opacity: isOn ? 1 : 0.25,
                  filter: isOn ? 'drop-shadow(0 0 4px rgba(255,193,7,0.6))' : 'none',
                  transition: 'all 0.1s', transform: isOn ? 'scale(1.05)' : 'scale(1)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}
              />
            ))}
          </div>
        ))}

        {/* 2列が1つになったセット (旧: VOL) */}
        {/* ✨ 修正：背景色（#f0f4f8）と点線（dashed border）、パディング、見出しをすべて削除 */}
        <div style={{ gridColumn: '4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            {[3, 4].map((colIndex) => (
              <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                {columnsState[colIndex].map((isOn, btnIndex) => (
                  <button
                    key={btnIndex}
                    onClick={() => toggleToken(colIndex, btnIndex)}
                    style={{
                      width: '46px', height: '46px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      backgroundImage: `url(${tokenImages[colIndex]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: isOn ? 'transparent' : '#f0f0f0',
                      opacity: isOn ? 1 : 0.25,
                      filter: isOn ? 'drop-shadow(0 0 4px rgba(0,112,243,0.5))' : 'none',
                      transition: 'all 0.1s', transform: isOn ? 'scale(1.05)' : 'scale(1)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎲 サイコロエリア */}
      <div style={{ 
        backgroundColor: '#fff', padding: '16px', borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px'
      }}>
        {/* 出目表示 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', minHeight: '54px', flexWrap: 'wrap', width: '100%' }}>
          {isRolling ? (
            Array.from({ length: diceCount }).map((_, i) => (
              <div key={i} style={{ width: '48px', height: '48px', backgroundColor: '#e9ecef', borderRadius: '12px', border: '2px solid #dee2e6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', transform: 'scale(0.95) rotate(10deg)' }}>⏳</div>
            ))
          ) : (
            Array.from({ length: diceCount }).map((_, i) => (
              <div key={i} style={{ width: '48px', height: '48px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '2px solid #dee2e6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', color: '#212529', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                {diceResults[i] !== undefined ? diceResults[i] : '？'}
              </div>
            ))
          )}
        </div>

        {/* 操作パネル */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <button 
            onClick={() => changeDiceCount(-1)} 
            disabled={diceCount <= 1 || isRolling}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: diceCount <= 1 ? '#e0e0e0' : '#f1f3f5', color: '#333', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}
          >
            －
          </button>

          <button 
            onClick={rollDice} 
            disabled={isRolling} 
            style={{ 
              flexGrow: 1, maxWidth: '180px', height: '44px', fontSize: '15px', fontWeight: 'bold', border: 'none', 
              borderRadius: '22px', backgroundColor: '#0070f3', color: '#fff', cursor: 'pointer', 
              boxShadow: '0 4px 8px rgba(0,112,243,0.2)', transition: 'background-color 0.2s'
            }}
          >
            {isRolling ? '振っています...' : `🎲 ${diceCount}個 振る`}
          </button>

          <button 
            onClick={() => changeDiceCount(1)} 
            disabled={diceCount >= 5 || isRolling}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: diceCount >= 5 ? '#e0e0e0' : '#f1f3f5', color: '#333', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}
          >
            ＋
          </button>
        </div>
      </div>

      {/* 🔄 リセットボタン */}
      <button
        onClick={handleResetAll}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#d32f2f',
          backgroundColor: 'transparent',
          border: '2px solid #ef9a9a',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center'
        }}
      >
        🔄 リセット
      </button>

    </div>
  );
}