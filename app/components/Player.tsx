// app/components/Player.tsx
'use client';

import { useState, useEffect } from 'react';

interface PlayerLog {
  rowIndex: number;
  timestamp: string;
  date: string;
  matchType: string;
  opponent: string;
  summary: string;
  note: string;
}

interface EventItem {
  rowIndex: number;
  date: string;
  eventName: string;
}

export default function Player() {
  const [mode, setMode] = useState<'search' | 'register' | 'settings'>('search');

  // 📦 データ状態
  const [logs, setLogs] = useState<PlayerLog[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 検索フィルター
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchOpponent, setSearchOpponent] = useState<string>('');
  const [searchSummary, setSearchSummary] = useState<string>('');
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState<boolean>(true);

  // 📝 登録フォーム
  const [regDate, setRegDate] = useState<string>('');
  const [regMatchType, setRegMatchType] = useState<string>('対戦');
  const [regOpponent, setRegOpponent] = useState<string>('');
  const [regSummary, setRegSummary] = useState<string>('');
  const [regNote, setRegNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ⚙️ 設定フォーム
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [newEventName, setNewEventName] = useState<string>('');
  const [isEventSubmitting, setIsEventSubmitting] = useState<boolean>(false);

  // ✏️ 編集ターゲット管理
  const [editingLog, setEditingLog] = useState<PlayerLog | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/players')
      .then(res => res.json())
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        // 空白行をフィルター（削除されたデータ行への対応）
        const activeLogs = (resData.data || []).filter((l: PlayerLog) => l.date || l.opponent || l.summary);
        // 配列を反転させて、新しく追加された行（直近の対戦記録）を最上部にする
        setLogs(activeLogs.reverse()); 
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  const fetchEvents = () => {
    fetch('/api/players?type=events')
      .then(res => res.json())
      .then(resData => {
        if (!resData.error) {
          const activeEvents = (resData.data || []).filter((e: EventItem) => e.date || e.eventName);
          setEvents(activeEvents.reverse());
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLogs();
    fetchEvents();
    const today = new Date().toISOString().split('T')[0];
    setRegDate(today);
    setNewEventDate(today);
  }, []);

  // 📝 matchTypeを装飾するヘルパー関数
  const decorateMatchType = (matchType: string) => {
    if (matchType === '対戦') return '対戦⚔️';
    if (matchType === '観戦') return '観戦👀';
    if (matchType === '情報' || matchType === '事前情報' || matchType === '事後情報') return '情報🔎';
    return matchType;
  };

  //  通常の対戦データ登録
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regOpponent.trim() || !regSummary.trim()) return;
    setIsSubmitting(true);
    try {
      const decoratedMatchType = decorateMatchType(regMatchType);
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: regDate.replace(/-/g, '/'), matchType: decoratedMatchType, opponent: regOpponent.trim(), summary: regSummary.trim(), note: regNote.trim() }),
      });
      if (res.ok) {
        setRegOpponent(''); setRegSummary(''); setRegNote('');
        fetchLogs(); setMode('search');
      }
    } catch { alert('通信エラー'); } finally { setIsSubmitting(false); }
  };

  // ⚙️ 新規イベント名の登録
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDate || !newEventName.trim()) return;
    setIsEventSubmitting(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'event', date: newEventDate.replace(/-/g, '/'), eventName: newEventName.trim() }),
      });
      if (res.ok) { setNewEventName(''); fetchEvents(); }
    } catch { alert('通信エラー'); } finally { setIsEventSubmitting(false); }
  };

  // 💾 編集の確定保存（警告アラート付き）
  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    if (!confirm('⚠️ この対戦記録の変更を確定してもよろしいですか？')) return;

    try {
      const decoratedLog = { ...editingLog, matchType: decorateMatchType(editingLog.matchType) };
      const res = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...decoratedLog, date: decoratedLog.date.replace(/-/g, '/') }),
      });
      if (res.ok) {
        setEditingLog(null);
        fetchLogs();
      }
    } catch { alert('更新に失敗しました'); }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (!confirm('⚠️ このイベント名称の変更を確定してもよろしいですか？')) return;

    try {
      const res = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'event', ...editingEvent, date: editingEvent.date.replace(/-/g, '/') }),
      });
      if (res.ok) {
        setEditingEvent(null);
        fetchEvents();
      }
    } catch { alert('更新に失敗しました'); }
  };

  // 🗑️ 削除処理（警告アラート付き）
  const handleDeleteItem = async (targetType: 'log' | 'event', rowIndex: number) => {
    const message = targetType === 'event' 
      ? '⚠️ このイベント名を削除（セルをクリア）しますか？登録済みの対戦履歴の日付データ自体は消えません。'
      : '⚠️ この対戦履歴データを完全に削除しますか？取り消しはできません。';
      
    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/players?targetType=${targetType}&rowIndex=${rowIndex}`, { method: 'DELETE' });
      if (res.ok) {
        alert('削除が完了しました。');
        targetType === 'event' ? fetchEvents() : fetchLogs();
      } else {
        alert('削除に失敗しました。');
      }
    } catch { alert('通信エラーが発生しました。'); }
  };

  // 🔍 検索フィルター
  const filteredLogs = logs.filter((log) => {
    const targetQueryDate = searchDate.replace(/-/g, '/');
    const matchDate = searchDate ? log.date === targetQueryDate || log.date.includes(targetQueryDate) : true;
    const matchOpponent = searchOpponent ? log.opponent.toLowerCase().includes(searchOpponent.toLowerCase()) : true;
    const matchSummary = searchSummary ? log.summary.toLowerCase().includes(searchSummary.toLowerCase()) : true;
    return matchDate && matchOpponent && matchSummary;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 🧭 サブメニュータブ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', padding: '6px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <button onClick={() => { setMode('search'); setEditingLog(null); }} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: mode === 'search' ? '#0070f3' : 'transparent', color: mode === 'search' ? '#fff' : '#555' }}>検索</button>
        <button onClick={() => { setMode('register'); setEditingLog(null); }} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: mode === 'register' ? '#0070f3' : 'transparent', color: mode === 'register' ? '#fff' : '#555' }}>登録</button>
        <button onClick={() => { setMode('settings'); setEditingLog(null); }} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: mode === 'settings' ? '#0070f3' : 'transparent', color: mode === 'settings' ? '#fff' : '#555' }}>設定</button>
      </div>

      {/* ─── 🔍 【検索モード】 ─── */}
      {mode === 'search' && !editingLog && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 検索パネル省略せず配置 */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: isSearchPanelOpen ? '12px' : '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSearchPanelOpen ? '4px' : '0px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>検索フィルター</h3>
              <button onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)} style={{ background: 'none', border: 'none', color: '#0070f3', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{isSearchPanelOpen ? '隠す' : '表示'}</button>
            </div>
            {isSearchPanelOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>イベント名から日付を選択</label>
                <select value={searchDate.replace(/\//g, '-')} onChange={(e) => setSearchDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', backgroundColor: '#fff' }}>
                  <option value="">-- イベントを選択して自動入力 --</option>
                  {events.map((ev, i) => (
                    <option key={i} value={ev.date.replace(/\//g, '-')}>{ev.eventName} ({ev.date})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>または直接日付を入力</label>
                <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>プレイヤー名</label>
                <input type="text" placeholder="プレイヤー名を入力..." value={searchOpponent} onChange={(e) => setSearchOpponent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>デッキ名</label>
                <input type="text" placeholder="使用デッキ名を入力..." value={searchSummary} onChange={(e) => setSearchSummary(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px' }} />
              </div>
            </div>
            )}
          </div>

          {/* 対戦履歴リスト (編集/削除ボタン付き) */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>対戦履歴 ({filteredLogs.length}件)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
              {filteredLogs.map((log, idx) => {
                const matchEvent = events.find(e => e.date === log.date);
                return (
                  <div key={idx} style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#868e96' }}>
                        {log.date} {matchEvent && <span style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px', fontSize: '10px' }}>{matchEvent.eventName}</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* ✏️ 編集ボタン */}
                        <button onClick={() => setEditingLog({ ...log, date: log.date.replace(/\//g, '-') })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }} title="編集">✏️</button>
                        {/* 🗑️ 削除ボタン */}
                        <button onClick={() => handleDeleteItem('log', log.rowIndex)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }} title="削除">🗑️</button>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0070f3', backgroundColor: '#e6f0fa', padding: '2px 8px', borderRadius: '6px' }}>{log.matchType}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      <span style={{ fontWeight: 'bold', color: '#111' }}>{log.opponent}</span>: <span style={{ fontWeight: '500', color: '#495057' }}>{log.summary}</span>
                    </div>
                    {log.note.trim() && <div style={{ fontSize: '12px', color: '#666', backgroundColor: '#fff', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #ced4da' }}>{log.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ インライン：対戦記録の編集フォーム画面 */}
      {mode === 'search' && editingLog && (
        <form onSubmit={handleUpdateLog} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0070f3', fontWeight: 'bold' }}>対戦記録の編集 (行: {editingLog.rowIndex})</h3>
            <button type="button" onClick={() => setEditingLog(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px' }}>キャンセル</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>日付</label>
            <input type="date" value={editingLog.date} onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>記録タイプ</label>
            <select value={editingLog.matchType} onChange={(e) => setEditingLog({ ...editingLog, matchType: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff' }}>
              <option value="対戦">対戦</option><option value="観戦">観戦</option><option value="情報">情報</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>プレイヤー名</label>
            <input type="text" value={editingLog.opponent} onChange={(e) => setEditingLog({ ...editingLog, opponent: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>デッキ名</label>
            <input type="text" value={editingLog.summary} onChange={(e) => setEditingLog({ ...editingLog, summary: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>備考</label>
            <textarea value={editingLog.note} onChange={(e) => setEditingLog({ ...editingLog, note: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', fontFamily: 'inherit' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0070f3', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>変更を保存</button>
        </form>
      )}

      {/* ─── 📝 【登録モード】 ─── */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#495057', fontWeight: 'bold' }}>新規対戦記録を投稿</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>登録イベント名から日付を反映</label>
            <select onChange={(e) => { if(e.target.value) setRegDate(e.target.value); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', backgroundColor: '#fff' }}>
              <option value="">-- イベントを選択してカレンダーを同期 --</option>
              {events.map((ev, i) => <option key={i} value={ev.date.replace(/\//g, '-')}>{ev.eventName} ({ev.date})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>日付（上記選択で連動）</label>
            <input type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>記録タイプ</label>
            <select value={regMatchType} onChange={(e) => setRegMatchType(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', backgroundColor: '#fff' }}>
              <option value="対戦">対戦</option><option value="観戦">観戦</option><option value="情報">情報</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>プレイヤー名</label>
            <input type="text" placeholder="相手のプレイヤー名を入力" value={regOpponent} onChange={(e) => setRegOpponent(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>デッキ名</label>
            <input type="text" placeholder="相手の使用デッキ名を入力" value={regSummary} onChange={(e) => setRegSummary(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>備考</label>
            <textarea placeholder="採用カード、展開、注意点など(任意)" value={regNote} onChange={(e) => setRegNote(e.target.value)} rows={3} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', color: '#fff', backgroundColor: isSubmitting ? '#9ac2f4' : '#0070f3', border: 'none', borderRadius: '12px', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,112,243,0.15)' }}>{isSubmitting ? '送信中...' : '記録'}</button>
        </form>
      )}

      {/* ─── ⚙️ 【設定モード】 ─── */}
      {mode === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* イベント登録用サブフォーム */}
          {!editingEvent ? (
            <form onSubmit={handleEventSubmit} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#495057', fontWeight: 'bold' }}>特定の日付にイベント名を登録</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>対象の日付</label>
                <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>名称 (イベント/大会名)</label>
                <input type="text" placeholder="例: 正月トーナメント" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da' }} />
              </div>
              <button type="submit" disabled={isEventSubmitting} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#fff', backgroundColor: '#2e7d32', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>イベント名を定義する</button>
            </form>
          ) : (
            // ✏️ イベント名のインライン編集
            <form onSubmit={handleUpdateEvent} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px', border: '2px solid #2e7d32' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#2e7d32', fontWeight: 'bold' }}>イベント名の編集</h3>
                <button type="button" onClick={() => setEditingEvent(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>キャンセル</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>日付</label>
                <input type="date" value={editingEvent.date} onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>イベント名称</label>
                <input type="text" value={editingEvent.eventName} onChange={(e) => setEditingEvent({ ...editingEvent, eventName: e.target.value })} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ced4da' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#fff', backgroundColor: '#2e7d32', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>イベント修正を保存</button>
            </form>
          )}

          {/* 登録済み一覧（編集/削除対応化） */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>登録済みのイベント一覧</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '30vh', overflowY: 'auto' }}>
              {events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{ev.eventName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setEditingEvent({ ...ev, date: ev.date.replace(/\//g, '-') })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }} title="編集">✏️</button>
                    <button onClick={() => handleDeleteItem('event', ev.rowIndex)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }} title="削除">🗑️</button>
                    <span style={{ fontSize: '12px', color: '#666', backgroundColor: '#e8f5e9', padding: '2px 8px', borderRadius: '4px' }}>{ev.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}