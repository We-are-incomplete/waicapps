'use client';

import { useState } from 'react';

export default function CodeConverter() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputDeckData, setOutputDeckData] = useState<string>('');
  const [outputKcg, setOutputKcg] = useState<string>('');
  const [payloadJson, setPayloadJson] = useState<string>('');
  const [bookmarkletCode, setBookmarkletCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    setPayloadJson('');
    setBookmarkletCode('');
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text || text === '-表示中-') {
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

  const handleCopyBookmarkletSetup = async () => {
    if (!bookmarkletCode) {
      alert('⚠️ まだコードの変換が行われていません。まずは有効なコードを入力して変換を行ってください。\n\n詳細な手順については、下部の「ツールの使い方・解説」をご覧ください。');
      return;
    }
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      alert(
        `📌 【初回セットアップ手順】\n\n` +
        `1. スマホのブラウザに適当なページをブックマーク登録します。\n` +
        `2. そのブックマークを編集し、URL（アドレス）をすべて消して、コピーしたコードを貼り付けます（名前を「デッキ反映ツール」等にします）。\n\n` +
        `✨ この作業は初回のみです！今後はこのブックマークをずっと使い回せます。`
      );
    } catch {
      alert('コピーに失敗しました。');
    }
  };

  const handleCopyPayloadAndOpen = async () => {
    if (!payloadJson) {
      alert('⚠️ まだコードの変換が行われていないため、公式ページへ反映するデータがありません。\n\n正しいコードを入力して変換を実行してからお試しください。\n詳しくは下部の「ツールの使い方・解説」をご覧ください。');
      return;
    }
    try {
      await navigator.clipboard.writeText(payloadJson);
      alert(
        `📋 反映データをコピーしました！\n\n` +
        `【使い方】\n` +
        `1. この後開く公式のデッキ作成ページで、登録した「デッキ反映ツール」のブックマークをポチッと押すだけです！`
      );
      window.open('https://tcg.kamitsubaki.jp/deck_edit/', '_blank');
    } catch {
      alert('コピーに失敗しました。');
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
      if (data.success) {
        alert(
          `✅ 同期が完了しました！\n\n` +
          `- 総カードID数: ${data.count}件\n` +
          `- 内部数値の読み込み成功: ${data.matched}件\n` +
          `- 内部数値が見つからないカード数: ${data.unmatched}件`
        );
      } else {
        alert(`❌ 同期に失敗しました: ${data.error || '不明なエラー'}`);
      }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConvert = async (targetType: 'deckData' | 'kcg') => {
    const trimmedInput = inputCode.trim();
    if (!trimmedInput) {
      alert('入力コードが入力されていません。');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/convert-deck?code=${encodeURIComponent(trimmedInput)}`, {
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.isListValid === false) {
          const forceExecute = window.confirm(
            "⚠️ カードリストが更新されている可能性があります。カードリストを更新することを推奨します。\n\n強制実行しますか？"
          );
          if (!forceExecute) {
            setIsLoading(false);
            return;
          }
        }

        const type = data.inputType;

        if (targetType === 'deckData') {
          setOutputDeckData(type === 'deckData' ? '-表示中-' : data.deckData);
        } else if (targetType === 'kcg') {
          setOutputKcg(type === 'kcg' ? '-表示中-' : data.kcgCode);
        }

        setPayloadJson(data.payloadJson || '');
        setBookmarkletCode(data.bookmarkletCode || '');
      } else {
        alert(`エラー: ${data.error || 'どの形式にも当てはまらないか、解析に失敗しました。'}`);
      }
    } catch (err: any) {
      alert('エラー: どの形式にも当てはまらないか、通信に失敗しました。');
    } finally {
      setIsLoading(false);
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

      <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
      </div>


      {/* 出力セクション（①、②のみ） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 出力① デッキデータ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>デッキデータ（AA-1/…）</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleConvert('deckData')} disabled={isLoading} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>⚡ 変換</button>
              <button onClick={() => handleCopy(outputDeckData, '出力①')} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600' }}>📋 コピー</button>
            </div>
          </div>
          <textarea value={outputDeckData} readOnly rows={3} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '13px', fontFamily: 'monospace', color: '#1f2937' }} />
        </div>

        {/* 出力② KCG圧縮コード */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>KCGコード（KCG-…）</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleConvert('kcg')} disabled={isLoading} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>⚡ 変換</button>
              <button onClick={() => handleCopy(outputKcg, '出力②')} style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600' }}>📋 コピー</button>
            </div>
          </div>
          <textarea value={outputKcg} readOnly rows={2} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '13px', fontFamily: 'monospace', color: '#1f2937' }} />
        </div>

      </div>
      <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
      </div>

      {/* 💡 スマホ連携アクション（出力②と使い方の間に横並びで配置） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>公式デッキコード（4bcDe6_…）　クリップボード読み取り式</label>
            <div style={{ display: 'flex', gap: '6px' }}>
            </div>
          </div>
        </div>
      <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
        <button
          onClick={handleCopyPayloadAndOpen}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#059669',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)'
          }}
        >
          コード変換&遷移
        </button>
        <button
          onClick={handleCopyBookmarkletSetup}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#4b5563',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          ブックマークコード コピー
        </button>
      </div>

      {/* 使い方解説（折りたたみ式） */}
      <details style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#374151' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>📖 ツールの使い方・解説（タップして展開）</summary>
        <div style={{ marginTop: '8px', lineHeight: '1.6', fontSize: '12px', color: '#4b5563' }}>
          <p><b>デッキデータ or KCGコードへの変換</b><br/>入力欄にコードを貼り付け、各出力欄の「変換」ボタンを押すと、それぞれの形式に変換されます。</p>
          <p><br/>--------------</p>
          <p><br/><b>公式データへの変換（準備）</b><br/>「ブックマークコードコピー」を押し、スマホのブラウザで適当なページをブックマーク。<br/>それを編集して、URLの部分にコピーしたコードを貼り付けます。名前は何でもいいです。</p>
          <p><br/><b>公式データへの変換（実行）</b><br/>デッキデータ or KCGコードをこのページの入力欄に入力した後、「コード変換&遷移」を押してください。<br/>数秒立つとメッセージが表示され、公式のデッキページに移動します。<br/>そこで準備したブックマークをタップすると、クリップボードを読み取ってデッキが反映されます。</p>
        </div>
      </details>

      {/* カードリスト同期ボタン（最下部に配置） */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSyncCards} disabled={isSyncing} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #059669', backgroundColor: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
          {isSyncing ? '同期中...' : '🔄 カードリスト同期'}
        </button>
      </div>

    </div>
  );
}