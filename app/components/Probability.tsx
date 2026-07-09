// app/components/Probability.tsx
'use client';

import { useState } from 'react';

export default function Probability() {
  const [subMode, setSubMode] = useState<string>('dummy1');

  // 💥 事故率用の入力変数
  const [deckCount1, setDeckCount1] = useState<string>('60');
  const [handCount1, setHandCount1] = useState<string>('8');
  const [allArtistCount1, setAllArtistCount1] = useState<string>('13');
  const [badArtistCount1, setBadArtistCount1] = useState<string>('1');
  const [mulligan1, setMulligan1] = useState<boolean>(true);

  // 🎲 マリガン数用の入力変数
  const [deckCount2, setDeckCount2] = useState<string>('60');
  const [handCount2, setHandCount2] = useState<string>('7');
  const [artistCount2, setArtistCount2] = useState<string>('4');

  // 🧪 Artist2t2枚率（旧ダミー3）用の入力変数（初期値設定）
  const [deckCount3, setDeckCount3] = useState<string>('60');
  const [handCount3, setHandCount3] = useState<string>('7');
  const [freeArtist3, setFreeArtist3] = useState<string>('8');
  const [condArtist3, setCondArtist3] = useState<string>('4');
  const [mulligan3, setMulligan3] = useState<boolean>(true);

  const allPresets = [
    { id: 'dummy1', name: '事故率' },
    { id: 'dummy2', name: 'マリガン数' },
    { id: 'dummy3', name: 'Artist2t2枚率' },
    { id: 'dummy4', name: 'ダミー4（仮）' },
    { id: 'dummy5', name: 'ダミー5（仮）' },
  ];

  const frequentIds = ['dummy1', 'dummy2'];

  const nCr = (n: number, r: number): number => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let num = 1;
    let den = 1;
    for (let i = 1; i <= r; i++) {
      num *= n - i + 1;
      den *= i;
    }
    return num / den;
  };

  const renderResult = () => {
    // 1️⃣ 【事故率】
    if (subMode === 'dummy1') {
      const N = parseInt(deckCount1); const H = parseInt(handCount1); const A = parseInt(allArtistCount1); const B = parseInt(badArtistCount1);
      if (isNaN(N) || isNaN(H) || isNaN(A) || isNaN(B) || N <= 0 || H <= 0 || A < 0 || B < 0 || B > A || A > N || H > N) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
      const otherCount = N - A; const totalPatterns = nCr(N, H); if (totalPatterns === 0) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
      const poolWithBadAndOther = B + otherCount; const patternsWithBad = nCr(poolWithBadAndOther, H) - nCr(otherCount, H);
      let percentage = 0;
      if (mulligan1) {
        const noArtistPatterns = nCr(otherCount, H); const validPatterns = totalPatterns - noArtistPatterns;
        if (validPatterns <= 0) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
        percentage = (patternsWithBad / validPatterns) * 100;
      } else {
        percentage = (patternsWithBad / totalPatterns) * 100;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>計算結果（事故率）</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{percentage.toFixed(3)} %</div>
        </div>
      );
    }

    // 2️⃣ 【マリガン数】
    if (subMode === 'dummy2') {
      const N = parseInt(deckCount2); const H = parseInt(handCount2); const A = parseInt(artistCount2);
      if (isNaN(N) || isNaN(H) || isNaN(A) || N <= 0 || H <= 0 || A < 0 || A > N || H > N) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
      const otherCount = N - A; const totalPatterns = nCr(N, H); const zeroArtistPatterns = nCr(otherCount, H);
      const zeroProbability = totalPatterns > 0 ? zeroArtistPatterns / totalPatterns : 0;
      const successPercentage = (1 - zeroProbability) * 100;
      const mulliganExpectation = zeroProbability >= 1 ? 0 : zeroProbability / (1 - zeroProbability);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>マリガン回数の期待値</span>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32', marginTop: '2px' }}>{mulliganExpectation.toFixed(3)} 回</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a0a0a0' }}>Artistが1枚以上ある確率</span>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0070f3', marginTop: '2px' }}>{successPercentage.toFixed(3)} %</div>
          </div>
        </div>
      );
    }

    // 3️⃣ 【✨ 新設：Artist2t2枚率】
    if (subMode === 'dummy3') {
      const N = parseInt(deckCount3);       // デッキ枚数
      const H = parseInt(handCount3);       // 初手枚数
      const F = parseInt(freeArtist3);      // 条件無しArtist枚数
      const C = parseInt(condArtist3);      // 条件有りArtist/サーチ枚数

      if (isNaN(N) || isNaN(H) || isNaN(F) || isNaN(C)) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
      if (N <= 0 || H <= 0 || F < 0 || C < 0 || (F + C) > N || (H + 1) > N) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;

      const O = N - F - C; // その他カードの枚数

      // 初手パターンの全網羅ループ用の変数
      let totalValidInitialPatterns = 0;
      let totalSuccessPatterns = 0;

      // 初手H枚のうち、[条件なしArtistがf枚]、[条件ありArtistがc枚]、[その他がo枚] 引く全組み合わせを走査
      for (let f = 0; f <= H; f++) {
        for (let c = 0; c <= H - f; c++) {
          const o = H - f - c;
          
          // 山札の各残り枚数を超えない正当な組み合わせパターン数
          const initialPatterns = nCr(F, f) * nCr(C, c) * nCr(O, o);
          if (initialPatterns === 0) continue;

          // 🌀 マリガン考慮がONの時、初手に「条件なしArtist」が0枚(f===0)の手札は強制引き直し（＝初手としてカウントしない）
          if (mulligan3 && f === 0) {
            continue; 
          }

          // 有効な初手として分母に累積
          totalValidInitialPatterns += initialPatterns;

          // この初手状態から、2ターン目に引く1枚の選択
          // 残りの山札内訳
          const remF = F - f;
          const remC = C - c;
          const remO = O - o;
          const remTotal = N - H;

          // パターンA: 次に条件なしArtistを引く (1枚)
          if (remF > 0) {
            const nextF_Patterns = initialPatterns * remF;
            if ((f + 1) + c >= 2) {
              totalSuccessPatterns += nextF_Patterns;
            }
          }

          // パターンB: 次に条件ありArtist/サーチを引く (1枚)
          if (remC > 0) {
            const nextC_Patterns = initialPatterns * remC;
            if (f + (c + 1) >= 2) {
              totalSuccessPatterns += nextC_Patterns;
            }
          }

          // パターンC: 次にその他カードを引く (1枚)
          if (remO > 0) {
            const nextO_Patterns = initialPatterns * remO;
            if (f + c >= 2) {
              totalSuccessPatterns += nextO_Patterns;
            }
          }
        }
      }

      // 最終隔離：分母が0、または何らかのエラー
      if (totalValidInitialPatterns === 0) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;

      // 2ターン目のドロー(1枚)を含めた全パターン数は [有効な初手の数 × 残りの山札枚数]
      const finalDenominator = totalValidInitialPatterns * (N - H);
      const finalPercentage = (totalSuccessPatterns / finalDenominator) * 100;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>計算結果（2t2枚率）</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{finalPercentage.toFixed(3)} %</div>
        </div>
      );
    }

    return <div style={{ color: '#666' }}>未実装</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 選択メニュー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', padding: '6px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {allPresets.filter(p => frequentIds.includes(p.id)).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubMode(tab.id)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: subMode === tab.id ? '#0070f3' : 'transparent',
              color: subMode === tab.id ? '#fff' : '#555', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab.name}
          </button>
        ))}

        <div style={{ flex: 1.2, position: 'relative' }}>
          <select
            value={frequentIds.includes(subMode) ? '' : subMode}
            onChange={(e) => e.target.value && setSubMode(e.target.value)}
            style={{
              width: '100%', padding: '10px 24px 10px 8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: !frequentIds.includes(subMode) ? '#0070f3' : '#f1f3f5',
              color: !frequentIds.includes(subMode) ? '#fff' : '#555', outline: 'none', appearance: 'none', textAlign: 'center'
            }}
          >
            <option value="" disabled style={{ color: '#999', background: '#fff' }}>▼ 他の確率</option>
            {allPresets.slice(2).map((preset) => (
              <option key={preset.id} value={preset.id} style={{ background: '#fff', color: '#333' }}>{preset.name}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', pointerEvents: 'none', color: !frequentIds.includes(subMode) ? '#fff' : '#555' }}>▼</span>
        </div>
      </div>

      {/* メメインコンテンツカード */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* 【事故率の入力画面】 */}
        {subMode === 'dummy1' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>初手に来てほしくないArtistだけを引く確率を計算します。</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>デッキ枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={deckCount1} onChange={(e) => setDeckCount1(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>手札枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={handCount1} onChange={(e) => setHandCount1(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>全Artist枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={allArtistCount1} onChange={(e) => setAllArtistCount1(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>事故Artist枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={badArtistCount1} onChange={(e) => setBadArtistCount1(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              <input type="checkbox" checked={mulligan1} onChange={(e) => setMulligan1(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              マリガン考慮（Artist0枚の手札を除外）
            </label>
          </div>
        )}

        {/* 【マリガン数の入力画面】 */}
        {subMode === 'dummy2' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>マリガンの確率と期待値を計算します。</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>デッキ枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={deckCount2} onChange={(e) => setDeckCount2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>手札枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={handCount2} onChange={(e) => setHandCount2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>Artist数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={artistCount2} onChange={(e) => setArtistCount2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        )}

        {/* 🧪 【✨ 新設：Artist2t2枚率の入力画面】 */}
        {subMode === 'dummy3' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
              2tにArtistが2枚以上手札にある確率を計算します。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 上段：デッキと初手枚数 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>デッキ枚数</label>
                  <input type="number" inputMode="numeric" pattern="[0-9]*" value={deckCount3} onChange={(e) => setDeckCount3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>初手枚数</label>
                  <input type="number" inputMode="numeric" pattern="[0-9]*" value={handCount3} onChange={(e) => setHandCount3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* 中段：2種類のArtist内訳 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>条件無しArtist枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={freeArtist3} onChange={(e) => setFreeArtist3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>条件有りArtist/サーチカード枚数</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" value={condArtist3} onChange={(e) => setCondArtist3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>

            </div>

            {/* 下段：マリガンチェックボックス */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              <input type="checkbox" checked={mulligan3} onChange={(e) => setMulligan3(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              マリガン考慮（条件なしArtist0枚なら引き直し）
            </label>
          </div>
        )}

        {/* 【その他の仮画面】 */}
        {subMode !== 'dummy1' && subMode !== 'dummy2' && subMode !== 'dummy3' && (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
            <strong>{allPresets.find(p => p.id === subMode)?.name}</strong> の入力項目（今後実装）
          </div>
        )}

        {/* ─── 共通の結果表示エリア ─── */}
        <hr style={{ border: '0', height: '1px', background: '#eee', margin: '20px 0 16px' }} />
        
        {renderResult()}

      </div>
    </div>
  );
}