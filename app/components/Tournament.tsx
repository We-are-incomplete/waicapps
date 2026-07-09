// app/components/Tournament.tsx
'use client';

import { useState, useRef } from 'react';

// 🎨 カラーパターンの定義（タップで循環。文字が見えやすいようにパステル調の薄い色）
const COLOR_CYCLE = [
  { name: 'white',  bg: '#ffffff', text: '#222222', border: '#cccccc' }, // 初期値
  { name: 'red',    bg: '#ffebee', text: '#c62828', border: '#ffcdd2' },
  { name: 'blue',   bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' },
  { name: 'yellow', bg: '#fffde7', text: '#f57f17', border: '#fff9c4' },
  { name: 'green',  bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
  { name: 'gray',   bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' }
];

export default function Tournament() {
  const [subMode, setSubMode] = useState<string>('tournament16');
  const [showDeck, setShowDeck] = useState<boolean>(false);

  // 🏆 16トーナメント用の状態（選手名・デッキ）
  const [playerData, setPlayerData] = useState<Array<{ name: string; deck: string }>>(
    Array.from({ length: 16 }, () => ({ name: '', deck: '' }))
  );
  
  // 🟢 各枠（16名分）の背景色インデックス（初期値 0 = 白）
  const [playerColors, setPlayerColors] = useState<number[]>(Array(16).fill(0));

  const seedOrder = [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2];

  // 🇨🇭 スイスドロー用の状態
  const [swissPlayers, setSwissPlayers] = useState<string>('80');
  const [swissRounds, setSwissRounds] = useState<string>('5');
  const [swissBorder, setSwissBorder] = useState<string>('16');
  const [swissDrop, setSwissDrop] = useState<string>('3');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleInputChange = (index: number, field: 'name' | 'deck', value: string) => {
    setPlayerData(prev => prev.map((player, i) => i === index ? { ...player, [field]: value } : player));
  };

  // 🔄 円マークがタップされたときに色を次のインデックスへ進める処理
  const handleColorCycle = (playerIndex: number) => {
    setPlayerColors(prev => prev.map((colorIdx, i) => {
      if (i === playerIndex) {
        return (colorIdx + 1) % COLOR_CYCLE.length;
      }
      return colorIdx;
    }));
  };

  // 🎨 Canvasを用いたトーナメント画像生成（背景カラー色分け対応版）
  const downloadTournamentImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boxWidth = 240; 
    const boxHeight = showDeck ? 64 : 48; 
    const leftPadding = 45; 
    const rightPadding = 30;
    const topPadding = 30;
    const bottomPadding = 40; 
    const matchGap = 16;
    const blockGap = 16; 
    
    const layer1Length = 40; 
    const layer2Length = 40; 
    const layer3Length = 40; 
    const finalLineLength = 30; 

    canvas.width = leftPadding + boxWidth + layer1Length + layer2Length + layer3Length + finalLineLength + rightPadding;
    canvas.height = (boxHeight * 8) + (matchGap * 7) + (blockGap * 3) + topPadding + bottomPadding;

    // 全体背景クリア
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentY = topPadding;
    const round1YList: number[] = [];

    // --- ① 1回戦：対戦ボックス、選手名、シード順位、背景色の描画 ---
    for (let matchIdx = 0; matchIdx < 8; matchIdx++) {
      const seed1 = seedOrder[matchIdx * 2];
      const seed2 = seedOrder[matchIdx * 2 + 1];
      
      const p1Idx = seed1 - 1;
      const p2Idx = seed2 - 1;
      const p1 = playerData[p1Idx];
      const p2 = playerData[p2Idx];

      // 各枠に設定された色設定を取得
      const c1 = COLOR_CYCLE[playerColors[p1Idx]];
      const c2 = COLOR_CYCLE[playerColors[p2Idx]];

      const centerY = currentY + boxHeight / 2;
      round1YList.push(centerY);

      // ──────────────────────────────────────────
      // 🟦 ボックス全体の枠線と背景色の描画
      // ──────────────────────────────────────────
      
      // 上半分スロットの背景色塗りつぶし
      ctx.fillStyle = c1.bg;
      ctx.fillRect(leftPadding, currentY, boxWidth, boxHeight / 2);

      // 下半分スロットの背景色塗りつぶし
      ctx.fillStyle = c2.bg;
      ctx.fillRect(leftPadding, currentY + boxHeight / 2, boxWidth, boxHeight / 2);

      // 全体の外枠を描画
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(leftPadding, currentY, boxWidth, boxHeight);

      // 中央の仕切り線を描画
      ctx.beginPath();
      ctx.moveTo(leftPadding, currentY + boxHeight / 2);
      ctx.lineTo(leftPadding + boxWidth, currentY + boxHeight / 2);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      if (showDeck) {
        // ──────────────────────────────────────────
        // 🟩 デッキ入力ON時のテキスト配置
        // ──────────────────────────────────────────
        
        // --- 上側スロット ---
        ctx.textAlign = 'right'; ctx.fillStyle = '#a0a0a0'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`#${seed1}`, leftPadding - 10, currentY + 10);

        ctx.textAlign = 'left';
        const p1Name = p1.name.trim() ? p1.name : `予選${seed1}位`;
        ctx.fillStyle = p1.name.trim() ? '#222222' : '#888888';
        ctx.font = p1.name.trim() ? 'bold 12px sans-serif' : 'italic 12px sans-serif';
        ctx.fillText(p1Name, leftPadding + 10, currentY + 4); 

        const hasDeck1 = p1.deck.trim();
        ctx.fillStyle = hasDeck1 ? '#666666' : '#b0b0b0'; ctx.font = '11px sans-serif';
        ctx.fillText(hasDeck1 ? p1.deck : '-', leftPadding + 10, currentY + 18); 

        // --- 下側スロット ---
        const sec2Y = currentY + 32;
        ctx.textAlign = 'right'; ctx.fillStyle = '#a0a0a0'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`#${seed2}`, leftPadding - 10, sec2Y + 10);

        ctx.textAlign = 'left';
        const p2Name = p2.name.trim() ? p2.name : `予選${seed2}位`;
        ctx.fillStyle = p2.name.trim() ? '#222222' : '#888888';
        ctx.font = p2.name.trim() ? 'bold 12px sans-serif' : 'italic 12px sans-serif';
        ctx.fillText(p2Name, leftPadding + 10, sec2Y + 4); 

        const hasDeck2 = p2.deck.trim();
        ctx.fillStyle = hasDeck2 ? '#666666' : '#b0b0b0'; ctx.font = '11px sans-serif';
        ctx.fillText(hasDeck2 ? p2.deck : '-', leftPadding + 10, sec2Y + 18); 

      } else {
        // ──────────────────────────────────────────
        // 🟦 デッキ入力OFF時のテキスト配置
        // ──────────────────────────────────────────
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right'; ctx.fillStyle = '#a0a0a0'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`#${seed1}`, leftPadding - 10, currentY + 12);
        ctx.fillText(`#${seed2}`, leftPadding - 10, currentY + 36);

        ctx.textAlign = 'left';
        const p1Name = p1.name.trim() ? p1.name : `予選${seed1}位`;
        ctx.fillStyle = p1.name.trim() ? '#222222' : '#888888';
        ctx.font = p1.name.trim() ? '13px sans-serif' : 'italic 13px sans-serif';
        ctx.fillText(p1Name, leftPadding + 10, currentY + 12);

        const p2Name = p2.name.trim() ? p2.name : `予選${seed2}位`;
        ctx.fillStyle = p2.name.trim() ? '#222222' : '#888888';
        ctx.font = p2.name.trim() ? '13px sans-serif' : 'italic 13px sans-serif';
        ctx.fillText(p2Name, leftPadding + 10, currentY + 36);
      }

      const extraGap = (matchIdx % 2 === 1) ? blockGap : 0;
      currentY += boxHeight + matchGap + extraGap;
    }

    // --- ② トーナメント全線画の描画（決勝まで） ---
    ctx.strokeStyle = '#444444'; ctx.lineWidth = 2;
    const round2YList: number[] = []; const x1_start = leftPadding + boxWidth; const x1_end = x1_start + layer1Length;
    for (let i = 0; i < 4; i++) {
      const topY = round1YList[i * 2]; const bottomY = round1YList[i * 2 + 1]; const midY = (topY + bottomY) / 2; round2YList.push(midY);
      ctx.beginPath(); ctx.moveTo(x1_start, topY); ctx.lineTo(x1_end, topY); ctx.moveTo(x1_start, bottomY); ctx.lineTo(x1_end, bottomY); ctx.moveTo(x1_end, topY); ctx.lineTo(x1_end, bottomY); ctx.stroke();
    }
    const round3YList: number[] = []; const x2_start = x1_end; const x2_end = x2_start + layer2Length;
    for (let i = 0; i < 2; i++) {
      const topY = round2YList[i * 2]; const bottomY = round2YList[i * 2 + 1]; const midY = (topY + bottomY) / 2; round3YList.push(midY);
      ctx.beginPath(); ctx.moveTo(x2_start, topY); ctx.lineTo(x2_end, topY); ctx.moveTo(x2_start, bottomY); ctx.lineTo(x2_end, bottomY); ctx.moveTo(x2_end, topY); ctx.lineTo(x2_end, bottomY); ctx.stroke();
    }
    const x3_start = x2_end; const x3_end = x3_start + layer3Length;
    const finalTopY = round3YList[0]; const finalBottomY = round3YList[1]; const finalWinnerY = (finalTopY + finalBottomY) / 2;
    ctx.beginPath(); ctx.moveTo(x3_start, finalTopY); ctx.lineTo(x3_end, finalTopY); ctx.moveTo(x3_start, finalBottomY); ctx.lineTo(x3_end, finalBottomY);
    ctx.moveTo(x3_end, finalTopY); ctx.lineTo(x3_end, finalBottomY); ctx.moveTo(x3_end, finalWinnerY); ctx.lineTo(x3_end + finalLineLength, finalWinnerY); ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tournament-colored-16-${new Date().toISOString().slice(0,10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // スイスドローのロジック
  const calculateSwiss = () => {
    const P = parseInt(swissPlayers); const R = parseInt(swissRounds); const B = parseInt(swissBorder); const D = parseInt(swissDrop);
    if (isNaN(P) || isNaN(R) || isNaN(B) || isNaN(D) || P <= 0 || R < 0 || B <= 0 || D <= 0) return { borderText: 'ーー', distribution: [] };
    let currentMap: { [w: number]: { [l: number]: number } } = { 0: { 0: P } };
    for (let r = 0; r < R; r++) {
      let nextMap: { [w: number]: { [l: number]: number } } = {};
      for (let w = 0; w <= r; w++) {
        for (let l = 0; l <= r; l++) {
          const count = currentMap[w]?.[l] || 0; if (count <= 0) continue;
          if (l >= D) { if (!nextMap[w]) nextMap[w] = {}; nextMap[w][l] = (nextMap[w][l] || 0) + count; continue; }
          const half = count / 2;
          if (!nextMap[w + 1]) nextMap[w + 1] = {}; nextMap[w + 1][l] = (nextMap[w + 1][l] || 0) + half;
          if (!nextMap[w]) nextMap[w] = {}; nextMap[w][l + 1] = (nextMap[w][l + 1] || 0) + half;
        }
      }
      currentMap = nextMap;
    }
    const finalResults: Array<{ wins: number; losses: number; count: number; isDropped: boolean }> = [];
    for (let w = R; w >= 0; w--) {
      for (let l = 0; l <= R; l++) {
        const count = currentMap[w]?.[l] || 0; if (count > 0) finalResults.push({ wins: w, losses: l, count: Math.round(count * 1000) / 1000, isDropped: l >= D && l < R });
      }
    }
    let accumulated = 0; let borderText = `${R}勝0敗`; 
    for (const res of finalResults) { if (res.isDropped) continue; accumulated += Math.ceil(res.count); if (accumulated >= B) { borderText = `${res.wins}勝${res.losses}敗`; break; } }
    return { borderText, distribution: finalResults };
  };

  const swissResult = calculateSwiss();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* モード選択タブ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', padding: '6px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setSubMode('tournament16')} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subMode === 'tournament16' ? '#0070f3' : 'transparent', color: subMode === 'tournament16' ? '#fff' : '#555', transition: 'all 0.2s' }}>16トーナメント</button>
        <button onClick={() => setSubMode('swiss')} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subMode === 'swiss' ? '#0070f3' : 'transparent', color: subMode === 'swiss' ? '#fff' : '#555', transition: 'all 0.2s' }}>スイスドロー</button>
      </div>

      {/* 🏆 16トーナメントモード */}
      {subMode === 'tournament16' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ① 最上部：画像出力コントロールエリア */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={downloadTournamentImage}
              style={{
                width: '100%', maxWidth: '280px', padding: '12px 20px', fontSize: '14px', fontWeight: 'bold',
                backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '24px',
                cursor: 'pointer', boxShadow: '0 4px 10px rgba(46,125,50,0.2)'
              }}
            >
              トーナメント表を画像として出力
            </button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* ② 中央部：入力欄（今回のメイン改修：右側にカラーサークル〇を設置） */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#495057', fontWeight: 'bold' }}>入力欄</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', userSelect: 'none', color: '#555' }}>
                <input type="checkbox" checked={showDeck} onChange={(e) => setShowDeck(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                デッキ入力
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playerData.map((player, i) => {
                const currentColor = COLOR_CYCLE[playerColors[i]];
                
                return (
                  <div key={i} style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', gap: showDeck ? '8px' : '0px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0070f3', minWidth: '45px' }}>{i + 1} 位</span>
                        <input type="text" value={player.name} onChange={(e) => handleInputChange(i, 'name', e.target.value)} placeholder={`選手名`} style={{ flexGrow: 1, border: 'none', borderBottom: '1px solid #ced4da', background: 'transparent', padding: '4px 0', fontSize: '14px', outline: 'none' }} />
                      </div>
                      
                      {/* ✨ 新設：入力欄の右端に設置されたタップ可能なカラーサークル 〇 */}
                      <button
                        onClick={() => handleColorCycle(i)}
                        title={`現在のステータスカラー: ${currentColor.name}`}
                        style={{
                          width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer',
                          backgroundColor: currentColor.bg, border: `2px solid ${currentColor.border}`,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.15s ease',
                          padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      />
                    </div>
                    {showDeck && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '53px', paddingRight: '30px' }}>
                        <input type="text" value={player.deck} onChange={(e) => handleInputChange(i, 'deck', e.target.value)} placeholder={`使用デッキ / アーキタイプ`} style={{ width: '100%', border: 'none', borderBottom: '1px dashed #adb5bd', background: 'transparent', padding: '2px 0', fontSize: '12px', color: '#555', outline: 'none' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ③ 最下部：現在の配置（プレビュー表示エリアもカラー同期対応） */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#888', display: 'block', marginBottom: '8px' }}>現在の配置（プレビュー）</span>
            <div style={{ minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 8 }).map((_, matchIdx) => {
                const seed1 = seedOrder[matchIdx * 2]; const seed2 = seedOrder[matchIdx * 2 + 1];
                const p1Idx = seed1 - 1; const p2Idx = seed2 - 1;
                const p1 = playerData[p1Idx]; const p2 = playerData[p2Idx];
                
                const c1 = COLOR_CYCLE[playerColors[p1Idx]];
                const c2 = COLOR_CYCLE[playerColors[p2Idx]];

                return (
                  <div key={matchIdx} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafafa', marginBottom: matchIdx % 2 === 1 ? '12px' : '0px' }}>
                    {/* 上段のプレビュー（色連動） */}
                    <div style={{ padding: '6px 10px', backgroundColor: c1.bg, borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '40px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: p1.name.trim() ? '500' : 'normal', color: p1.name.trim() ? '#222' : '#888', fontStyle: p1.name.trim() ? 'normal' : 'italic' }}>{p1.name.trim() ? p1.name : `予選${seed1}位`}</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#999' }}>#{seed1}</span>
                      </div>
                      {showDeck && p1.deck.trim() && <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{p1.deck}</div>}
                    </div>
                    {/* 下段のプレビュー（色連動） */}
                    <div style={{ padding: '6px 10px', backgroundColor: c2.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '40px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: p2.name.trim() ? '500' : 'normal', color: p2.name.trim() ? '#222' : '#888', fontStyle: p2.name.trim() ? 'normal' : 'italic' }}>{p2.name.trim() ? p2.name : `予選${seed2}位`}</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#999' }}>#{seed2}</span>
                      </div>
                      {showDeck && p2.deck.trim() && <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{p2.deck}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* スイスドローモード */}
      {subMode === 'swiss' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', backgroundColor: '#e8f5e9', width: '100%', padding: '14px 0', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32' }}>予選通過ボーダー</span>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1b5e20' }}>{swissResult.borderText}</div>
            </div>
            <div style={{ width: '100%' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '8px', paddingLeft: '4px' }}>人数分布(予測)</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                {swissResult.distribution.map((res, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: '1px solid #edf2f7' }}>
                    <span style={{ fontWeight: 'bold', color: res.isDropped ? '#999' : '#333' }}>{res.wins}勝 {res.losses}敗 {res.isDropped && <span style={{ fontSize: '10px', color: '#d32f2f', backgroundColor: '#ffebee', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>強制ドロップ</span>}</span>
                    <span style={{ fontWeight: '500', color: '#0070f3' }}>{Math.ceil(res.count)} 人</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>設定</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>人数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={swissPlayers} onChange={(e) => setSwissPlayers(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>試合数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={swissRounds} onChange={(e) => setSwissRounds(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>上位ボーダー (位)</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={swissBorder} onChange={(e) => setSwissBorder(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>強制ドロップ (敗)</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={swissDrop} onChange={(e) => setSwissDrop(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}