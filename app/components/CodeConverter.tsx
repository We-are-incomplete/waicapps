'use client';

import { useState } from 'react';

export default function CodeConverter() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputDeckData, setOutputDeckData] = useState<string>('');
  const [outputKcg, setOutputKcg] = useState<string>('');
  const [deckName, setDeckName] = useState<string>('');

  // 💡 ① ボタンごとのローディング状態を独立させる
  const [isLoadingDeck, setIsLoadingDeck] = useState<boolean>(false);
  const [isLoadingKcg, setIsLoadingKcg] = useState<boolean>(false);
  const [isLoadingOfficial, setIsLoadingOfficial] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputCode(text);
    } catch {
      alert('クリップボードの読み取りに失敗しました。');
    }
  };

  const handleClear = () => {
    setInputCode('');
    setOutputDeckData('');
    setOutputKcg('');
    setDeckName('');
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text || text === '-表示中-' || text === '変換中...') {
      alert('コピーするテキストがありません。');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert(`📋 ${label}をクリップボードにコピーしました！`);
    } catch {
      alert('コピーに失敗しました。');
    }
  };

  const fetchConversionData = async (codeToFetch: string): Promise<any> => {
    const trimmedInput = codeToFetch.trim();
    const effectiveDeckName = deckName.trim();

    try {
      const res = await fetch(
        `/api/convert-deck?code=${encodeURIComponent(trimmedInput)}&deckName=${encodeURIComponent(effectiveDeckName)}`,
        {
          headers: {
            'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
          },
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        alert('サーバーからの応答の解析に失敗しました。');
        return null;
      }

      if (res.ok && data && data.success) {
        if (data.isListValid === false) {
          const forceExecute = window.confirm(
            "⚠️ カードリストが更新されている可能性があります。カードリストを更新することを推奨します。\n\n強制実行しますか？"
          );
          if (!forceExecute) return null;
        }
        return data;
      } else {
        alert(`エラー: ${data?.error || 'どの形式にも当てはまらないか、解析に失敗しました。'}`);
        return null;
      }
    } catch {
      alert('エラー: どの形式にも当てはまらないか、通信に失敗しました。');
      return null;
    }
  };

  // デッキデータ変換
  const handleConvertDeckData = async () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      alert('入力コードが入力されていません。');
      return;
    }

    setIsLoadingDeck(true);
    setOutputDeckData('変換中...');

    const data = await fetchConversionData(trimmedInput);
    setIsLoadingDeck(false);

    if (data) {
      setOutputDeckData(data.deckData || '');
    } else {
      setOutputDeckData('');
    }
  };

  // KCGコード変換
  const handleConvertKcg = async () => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      alert('入力コードが入力されていません。');
      return;
    }

    setIsLoadingKcg(true);
    setOutputKcg('変換中...');

    const data = await fetchConversionData(trimmedInput);
    setIsLoadingKcg(false);

    if (data) {
      setOutputKcg(data.kcgCode || '');
    } else {
      setOutputKcg('');
    }
  };

  // ③ 公式コード変換&遷移（入力が空のときのポップアップ・キャンセル処理対応）
  const handleOpenOfficialWithHash = async () => {
    const trimmedInput = inputCode.trim();

    if (!trimmedInput) {
      const confirmEmpty = window.confirm(
        "⚠️ 入力コードが入力されていません。\n\nハッシュ無しの空のデッキ作成ページに遷移しますか？"
      );
      if (!confirmEmpty) {
        return; // キャンセルされたら何もしない
      }
      // 空の場合はハッシュ無しで遷移
      window.open('https://tcg.kamitsubaki.jp/deck_create/', '_blank');
      return;
    }

    const isOfficialUrlOrCode = 
      trimmedInput.includes('deck_detail/') || 
      trimmedInput.includes('deck_create/') || 
      (!trimmedInput.startsWith("KCG-") && !trimmedInput.includes('*side*') && !trimmedInput.includes('/'));

    if (isOfficialUrlOrCode) {
      const codeMatch = trimmedInput.match(/deck_detail\/([^\/]+)/) || trimmedInput.match(/deck_create\/([^\/]+)/);
      const baseCode = codeMatch ? codeMatch[1] : trimmedInput;
      window.open(`https://tcg.kamitsubaki.jp/deck_create/${baseCode}/`, '_blank');
      return;
    }

    const isKcg = trimmedInput.startsWith("KCG-");
    const isDeckData = trimmedInput.includes('*side*') || trimmedInput.includes('/');

    if (isKcg || isDeckData) {
      setIsLoadingOfficial(true);
      const data = await fetchConversionData(trimmedInput);
      setIsLoadingOfficial(false);

      if (data && data.officialUrlWithHash) {
        window.open(data.officialUrlWithHash, '_blank');
      }
      return;
    }

    alert('エラー: 入力されたコードの形式が正しくありません。');
  };

  // ② ブックマークレットコピーボタン（入力が空でもキャンセルせずコピー可能に）
  const handleCopyBookmarkletSetup = async () => {
    const trimmedInput = inputCode.trim();
    // 入力がない場合は空またはデフォルトとしてAPIを叩く
    const targetCode = trimmedInput || "YmI5N2_ZlNmMt_OWU1NS";

    const data = await fetchConversionData(targetCode);

    if (data && data.bookmarkletCode) {
      try {
        await navigator.clipboard.writeText(data.bookmarkletCode);
        alert(
          `📌 【初回セットアップ手順】\n\n` +
          `1. スマホのブラウザに適当なページをブックマーク登録します。\n` +
          `2. そのブックマークを編集し、URL（アドレス）をすべて消して、コピーしたコードを貼り付けます（名前を「デッキ反映ツール」等にします）。\n\n` +
          `✨ この作業は初回のみです！今後はこのブックマークをずっと使い回せます。`
        );
      } catch {
        alert('コピーに失敗しました。');
      }
    }
  };

  const handleSyncCards = async () => {
    if (!confirm('⚠️ 公式サイトから最新のカード情報を取得してスプレッドシートを更新しますか？')) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-cards', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      });
      const data = await res.json();
      if (data && data.success) {
        alert(`✅ 同期完了: ${data.count}件`);
      } else {
        alert(`❌ 同期失敗: ${data?.error || '不明なエラー'}`);
      }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '700px', margin: '0 auto' }}>
      
      {/* 入力セクション */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>入力コード</label>
        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="デッキコード(4bcDe6_…) デッキデータ(AA-1/…) KCGコード(KCG-…)のいずれかを入力してください。"
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePaste} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151' }}>📋 貼り付け</button>
          <button onClick={handleClear} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>🗑️ 消去</button>
        </div>
      </div>

      <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}></div>

      {/* 出力セクション */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 出力① デッキデータ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>デッキデータ（AA-1/…）</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleConvertDeckData} disabled={isLoadingDeck} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>
                {isLoadingDeck ? '変換中...' : '⚡ 変換'}
              </button>
              <button onClick={() => handleCopy(outputDeckData, 'デッキデータ')} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600' }}>📋 コピー</button>
            </div>
          </div>
          <textarea value={outputDeckData} readOnly rows={3} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '13px', fontFamily: 'monospace', color: '#1f2937' }} />
        </div>

        {/* 出力② KCG圧縮コード */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>KCGコード（KCG-…）</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleConvertKcg} disabled={isLoadingKcg} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>
                {isLoadingKcg ? '変換中...' : '⚡ 変換'}
              </button>
              <button onClick={() => handleCopy(outputKcg, 'KCGコード')} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600' }}>📋 コピー</button>
            </div>
          </div>
          <textarea value={outputKcg} readOnly rows={2} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '13px', fontFamily: 'monospace', color: '#1f2937' }} />
        </div>

      </div>

      <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}></div>

      {/* デッキ名入力欄 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>公式コード(4BcDe6_…)</label>
        <input
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="デッキ名 空欄の場合は空文字として扱われます"
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }}
        />
      </div>

      {/* 連携ボタン */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
        <button onClick={handleOpenOfficialWithHash} disabled={isLoadingOfficial} style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>
          {isLoadingOfficial ? '変換処理中...' : '公式コード変換&遷移'}
        </button>
        <button onClick={handleCopyBookmarkletSetup} style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#4b5563', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
          ブックマークコード コピー
        </button>
      </div>

      {/* 使い方解説 */}
      <details style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#374151' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>📖 ツールの使い方・解説（タップして展開）</summary>
        <div style={{ marginTop: '8px', lineHeight: '1.6', fontSize: '12px', color: '#4b5563' }}>
          <p><b>デッキデータ or KCGコードへの変換</b><br/>入力欄にコードを貼り付け、各出力欄の「変換」ボタンを押すと、それぞれの形式に変換されます。</p>
          <p><br/>--------------</p>
          <p><br/><b>公式データへの変換（準備）</b><br/>【STEP1】「ブックマークコードコピー」を押し、スマホの標準ブラウザで適当なページをブックマークしてください。<br/>【STEP2】そのブックマークを編集して、URLの部分にコピーしたコードを貼り付けます。名前は何でもいいですが、入力しやすくしておいてください。</p>
          <p><br/><b>公式データへの変換（実行-PC）</b><br/>【STEP1】デッキデータ or KCGコードを入力した後、「コード変換&遷移」を押してください。<br/>数秒立つとメッセージが表示され、公式のデッキページに移動します。<br/>【STEP2】移動した公式ページで、準備で登録したブックマークを呼び出してください。ページが更新されて、デッキが反映されます。<br/><br/><b>公式データへの変換（実行-スマホ）</b><br/>【STEP1】デッキデータ or KCGコードを入力した後、「コード変換&遷移」を押してください。公式ページに移動します。<br/>【STEP2】移動した公式ページで、検索欄に準備で登録したブックマークの名前を入力してください(<b>Enterや決定は押さないで！</b>)。<br/>【STEP3】候補にブックマークが出てくると思うので、それをタップしてください。ページが更新されて、デッキが反映されます。</p>
        </div>
      </details>

      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSyncCards} disabled={isSyncing} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #059669', backgroundColor: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
          {isSyncing ? '同期中...' : '🔄 カードリスト同期'}
        </button>
      </div>

    </div>
  );
}