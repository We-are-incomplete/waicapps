/* STREAMING_CHUNK:Importing React hooks and configuring component structure */
'use client';

import { useState } from 'react';

export default function Probability() {
const [subMode, setSubMode] = useState('dummy1');

// 💥 事故率用の入力変数
const [deckCount1, setDeckCount1] = useState('60');
const [handCount1, setHandCount1] = useState('8');
const [allArtistCount1, setAllArtistCount1] = useState('13');
const [badArtistCount1, setBadArtistCount1] = useState('1');
const [mulligan1, setMulligan1] = useState(true);

// 🎲 マリガン数用の入力変数
const [deckCount2, setDeckCount2] = useState('60');
const [handCount2, setHandCount2] = useState('7');
const [artistCount2, setArtistCount2] = useState('4');

// 🧪 Artist2t2枚率用の入力変数
const [deckCount3, setDeckCount3] = useState('60');
const [handCount3, setHandCount3] = useState('7');
const [freeArtist3, setFreeArtist3] = useState('8');
const [condArtist3, setCondArtist3] = useState('4');
const [mulligan3, setMulligan3] = useState(true);

// ⚡️ 【✨ 新設：α事故率】用の入力変数
const [deckAlpha, setDeckAlpha] = useState('60');
const [handAlpha, setHandAlpha] = useState('7');
const [artistAlpha, setArtistAlpha] = useState('4');
const [warpAlpha, setWarpAlpha] = useState('4');
const [tieAlpha, setTieAlpha] = useState('4');
const [shockAlpha, setShockAlpha] = useState('0');
const [songAlpha, setSongAlpha] = useState('10');
const [mulliganAlpha, setMulliganAlpha] = useState(true);

/* STREAMING_CHUNK:Defining presets and combinatorial helper functions */
const allPresets = [
{ id: 'dummy1', name: '事故率' },
{ id: 'dummy2', name: 'マリガン数' },
{ id: 'dummy3', name: 'Artist2t2枚率' },
{ id: 'alpha', name: 'α事故率' },
{ id: 'dummy4', name: 'ダミー4（仮）' },
];

const frequentIds = ['dummy1', 'dummy2', 'alpha'];

// 組み合わせ計算 (nCr)
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

/* STREAMING_CHUNK:Implementing calculation logic for each subMode */
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

// 2️⃣ 【マリガン数（拡張：4回以上確率＆柱状グラフ）】
if (subMode === 'dummy2') {
  const N = parseInt(deckCount2); const H = parseInt(handCount2); const A = parseInt(artistCount2);
  if (isNaN(N) || isNaN(H) || isNaN(A) || N <= 0 || H <= 0 || A < 0 || A > N || H > N) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
  const otherCount = N - A; const totalPatterns = nCr(N, H); const zeroArtistPatterns = nCr(otherCount, H);
  const zeroProbability = totalPatterns > 0 ? zeroArtistPatterns / totalPatterns : 0;
  const successPercentage = (1 - zeroProbability) * 100;
  const mulliganExpectation = zeroProbability >= 1 ? 0 : zeroProbability / (1 - zeroProbability);

  // マリガン回数ごとの確率分布 (0回, 1回, 2回, 3回, 4回以上)
  const p0 = zeroProbability;
  const prob0 = (1 - p0) * 100;
  const prob1 = p0 * (1 - p0) * 100;
  const prob2 = Math.pow(p0, 2) * (1 - p0) * 100;
  const prob3 = Math.pow(p0, 3) * (1 - p0) * 100;
  const prob4Plus = Math.pow(p0, 4) * 100;

  const mulliganDist = [
    { label: '0回', prob: prob0 },
    { label: '1回', prob: prob1 },
    { label: '2回', prob: prob2 },
    { label: '3回', prob: prob3 },
    { label: '4回以上', prob: prob4Plus },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>マリガン回数の期待値</span>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32', marginTop: '2px' }}>{mulliganExpectation.toFixed(3)} 回</div>
      </div>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a0a0a0' }}>Artist1枚以上確率</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0070f3' }}>{successPercentage.toFixed(2)} %</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a0a0a0' }}>4回以上マリガン確率</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e03131' }}>{prob4Plus.toFixed(3)} %</span>
        </div>
      </div>

      {/* 柱状グラフエリア */}
      <div style={{ width: '100%', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057', textAlign: 'center' }}>回数の平均的な分布（マリガン回数）</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', paddingTop: '10px', borderBottom: '2px solid #dee2e6' }}>
          {mulliganDist.map((item, idx) => {
            const heightPercent = Math.max(Math.min(item.prob, 100), 4);
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{item.prob.toFixed(1)}%</span>
                <div style={{ width: '24px', height: `${heightPercent}%`, backgroundColor: '#0070f3', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057', marginTop: '6px' }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* STREAMING_CHUNK:Implementing Artist 2t 2-card probability logic */
if (subMode === 'dummy3') {
  const N = parseInt(deckCount3);
  const H = parseInt(handCount3);
  const F = parseInt(freeArtist3);
  const C = parseInt(condArtist3);

  if (isNaN(N) || isNaN(H) || isNaN(F) || isNaN(C)) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
  if (N <= 0 || H <= 0 || F < 0 || C < 0 || (F + C) > N || (H + 1) > N) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;

  const O = N - F - C;
  let totalValidInitialPatterns = 0;
  let totalSuccessPatterns = 0;

  for (let f = 0; f <= H; f++) {
    for (let c = 0; c <= H - f; c++) {
      const o = H - f - c;
      const initialPatterns = nCr(F, f) * nCr(C, c) * nCr(O, o);
      if (initialPatterns === 0) continue;

      if (mulligan3 && f === 0) {
        continue; 
      }

      totalValidInitialPatterns += initialPatterns;

      const remF = F - f;
      const remC = C - c;
      const remO = O - o;

      if (remF > 0) {
        const nextF_Patterns = initialPatterns * remF;
        if ((f + 1) + c >= 2) {
          totalSuccessPatterns += nextF_Patterns;
        }
      }

      if (remC > 0) {
        const nextC_Patterns = initialPatterns * remC;
        if (f + (c + 1) >= 2) {
          totalSuccessPatterns += nextC_Patterns;
        }
      }

      if (remO > 0) {
        const nextO_Patterns = initialPatterns * remO;
        if (f + c >= 2) {
          totalSuccessPatterns += nextO_Patterns;
        }
      }
    }
  }

  if (totalValidInitialPatterns === 0) return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;

  const finalDenominator = totalValidInitialPatterns * (N - H);
  const finalPercentage = (totalSuccessPatterns / finalDenominator) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>計算結果（2t2枚率）</span>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{finalPercentage.toFixed(3)} %</div>
    </div>
  );
}

/* STREAMING_CHUNK:Implementing advanced Alpha Accident probability calculation with Expectation Shock recursion */
if (subMode === 'alpha') {
  const N = parseInt(deckAlpha);
  const H = parseInt(handAlpha);
  const A0 = parseInt(artistAlpha);
  const W = parseInt(warpAlpha);
  const Nt = parseInt(tieAlpha);
  const Sc = parseInt(shockAlpha);
  const As = parseInt(songAlpha);

  if (isNaN(N) || isNaN(H) || isNaN(A0) || isNaN(W) || isNaN(Nt) || isNaN(Sc) || isNaN(As)) {
    return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
  }

  const totalCardTypes = A0 + W + Nt + Sc + As;
  if (N <= 0 || H <= 0 || totalCardTypes > N || H > N) {
    return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
  }

  const O = N - totalCardTypes; // ハズレカード枚数

  let validInitialPatterns = 0;
  let countBoth = 0;
  let countSongOnly = 0;
  let countWarnekuOnly = 0;
  let countNeither = 0;

  // 期待値ショックの連鎖ドロー処理を再帰的にシミュレートする関数
  const resolveHand = (
    a0: number, w: number, t: number, s: number, as: number, o: number,
    remA0: number, remW: number, remNt: number, remSc: number, remAs: number, remO: number,
    remTotal: number, currentWeight: number
  ): void => {
    // もし手札に期待値ショック(s)が残っており、山札にカードが残っている場合
    if (s > 0 && remTotal > 0) {
      const options = [
        { count: remA0, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na + 1, nw, nt, ns, nas, no], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra - 1, rw, rt, rs, ras, ro] },
        { count: remW, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw + 1, nt, ns, nas, no], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw - 1, rt, rs, ras, ro] },
        { count: remNt, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt + 1, ns, nas, no], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt - 1, rs, ras, ro] },
        { count: remSc, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns + 1, nas, no], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs - 1, ras, ro] },
        { count: remAs, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns, nas + 1, no], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs, ras, ras - 1, ro] },
        { count: remO, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns, nas, no + 1], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs, ras, ro - 1] },
      ];

      // Note: Adjusted remAs update destructing mapping alignment carefully below
      const actualOptions = [
        { count: remA0, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na + 1, nw, nt, ns, nas, no] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra - 1, rw, rt, rs, ras, ro] as [number, number, number, number, number, number] },
        { count: remW, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw + 1, nt, ns, nas, no] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw - 1, rt, rs, ras, ro] as [number, number, number, number, number, number] },
        { count: remNt, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt + 1, ns, nas, no] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt - 1, rs, ras, ro] as [number, number, number, number, number, number] },
        { count: remSc, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns + 1, nas, no] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs - 1, ras, ro] as [number, number, number, number, number, number] },
        { count: remAs, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns, nas + 1, no] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs, ras - 1, ro] as [number, number, number, number, number, number] },
        { count: remO, update: (na: number, nw: number, nt: number, ns: number, nas: number, no: number) => [na, nw, nt, ns, nas, no + 1] as [number, number, number, number, number, number], remUpdate: (ra: number, rw: number, rt: number, rs: number, ras: number, ro: number) => [ra, rw, rt, rs, ras, ro - 1] as [number, number, number, number, number, number] },
      ];

      for (const opt of actualOptions) {
        if (opt.count > 0) {
          const subWeight = currentWeight * (opt.count / remTotal);
          const [n_a0, n_w, n_t, n_s, n_as, n_o] = opt.update(a0, w, t, s - 1, as, o);
          const [r_a0, r_w, r_t, r_s, r_as, r_o] = opt.remUpdate(remA0, remW, remNt, remSc, remAs, remO);
          
          resolveHand(
            n_a0, n_w, n_t, n_s, n_as, n_o,
            r_a0, r_w, r_t, r_s, r_as, r_o,
            remTotal - 1, subWeight
          );
        }
      }
    } else {
      const hasSong = as > 0;
      const hasWarneku = (w > 0 || t > 0);

      if (hasSong && hasWarneku) countBoth += currentWeight;
      else if (hasSong && !hasWarneku) countSongOnly += currentWeight;
      else if (!hasSong && hasWarneku) countWarnekuOnly += currentWeight;
      else countNeither += currentWeight;
    }
  };

  for (let a0 = 0; a0 <= Math.min(H, A0); a0++) {
    for (let w = 0; w <= Math.min(H - a0, W); w++) {
      for (let t = 0; t <= Math.min(H - a0 - w, Nt); t++) {
        for (let s = 0; s <= Math.min(H - a0 - w - t, Sc); s++) {
          for (let as = 0; as <= Math.min(H - a0 - w - t - s, As); as++) {
            const o = H - a0 - w - t - s - as;
            if (o < 0 || o > O) continue;

            const patterns = nCr(A0, a0) * nCr(W, w) * nCr(Nt, t) * nCr(Sc, s) * nCr(As, as) * nCr(O, o);
            if (patterns === 0) continue;

            if (mulliganAlpha && a0 === 0) continue;

            validInitialPatterns += patterns;

            const remA0 = A0 - a0;
            const remW = W - w;
            const remNt = Nt - t;
            const remSc = Sc - s;
            const remAs = As - as;
            const remO = O - o;
            const remTotal = N - H;

            resolveHand(
              a0, w, t, s, as, o,
              remA0, remW, remNt, remSc, remAs, remO,
              remTotal, patterns
            );
          }
        }
      }
    }
  }

  if (validInitialPatterns === 0) {
    return <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>ーー</div>;
  }

  const pBoth = (countBoth / validInitialPatterns) * 100;
  const pSongOnly = (countSongOnly / validInitialPatterns) * 100;
  const pWarnekuOnly = (countWarnekuOnly / validInitialPatterns) * 100;
  const pNeither = (countNeither / validInitialPatterns) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#868e96' }}>計算結果（α事故率 詳細分析）</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>αSong & ワーネク両方</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32', marginTop: '4px' }}>{pBoth.toFixed(3)} %</span>
        </div>
        <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>αSongのみ（ワーネク無）</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e03131', marginTop: '4px' }}>{pSongOnly.toFixed(3)} %</span>
        </div>
        <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>ワーネクのみ（αSong無）</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59f00', marginTop: '4px' }}>{pWarnekuOnly.toFixed(3)} %</span>
        </div>
        <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>両方なし（完全事故）</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3', marginTop: '4px' }}>{pNeither.toFixed(3)} %</span>
        </div>
      </div>
    </div>
  );
}

return <div style={{ color: '#666' }}>未実装</div>;


};

/* STREAMING_CHUNK:Rendering UI layout, tab menus and input forms */
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
        {allPresets.filter(p => !frequentIds.includes(p.id)).map((preset) => (
          <option key={preset.id} value={preset.id} style={{ background: '#fff', color: '#333' }}>{preset.name}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', pointerEvents: 'none', color: !frequentIds.includes(subMode) ? '#fff' : '#555' }}>▼</span>
    </div>
  </div>

  {/* メインコンテンツカード */}
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

    {/* 【Artist2t2枚率の入力画面】 */}
    {subMode === 'dummy3' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
          2tにArtistが2枚以上手札にある確率を計算します。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>条件無しArtist枚数</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={freeArtist3} onChange={(e) => setFreeArtist3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>条件有りArtist/サーチカード枚数</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={condArtist3} onChange={(e) => setCondArtist3(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', boxSizing: 'border-box' }} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', fontWeight: 'bold' }}>
          <input type="checkbox" checked={mulligan3} onChange={(e) => setMulligan3(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          マリガン考慮（条件なしArtist0枚なら引き直し）
        </label>
      </div>
    )}

    {/* 【✨ 新設：α事故率の入力画面】 */}
    {subMode === 'alpha' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
          Magic・Song・初手Aの枚数および「期待値ショック」の連鎖ドローを考慮した事故率を計算します。
        </p>
        
        {/* 1️⃣ 基本枚数 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0070f3', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
            基本枚数
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>山札総数</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={deckAlpha} onChange={(e) => setDeckAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>初手枚数</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={handAlpha} onChange={(e) => setHandAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>初手Artist</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={artistAlpha} onChange={(e) => setArtistAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* 2️⃣ Song枚数 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0070f3', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
            Song枚数
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>αSong</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={songAlpha} onChange={(e) => setSongAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* 3️⃣ Magic枚数 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0070f3', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
            Magic枚数
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>ワープ</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={warpAlpha} onChange={(e) => setWarpAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>ネクタイ</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={tieAlpha} onChange={(e) => setTieAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>期待値ショック</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" value={shockAlpha} onChange={(e) => setShockAlpha(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
          <input type="checkbox" checked={mulliganAlpha} onChange={(e) => setMulliganAlpha(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          マリガン考慮（初手Aが0枚なら引き直し）
        </label>
      </div>
    )}

    {/* 【その他の仮画面】 */}
    {!['dummy1', 'dummy2', 'dummy3', 'alpha'].includes(subMode) && (
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