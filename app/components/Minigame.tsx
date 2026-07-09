// app/components/Minigame.tsx
'use client';

import { useState, useEffect } from 'react';

type MinigameState = 'menu' | 'random' | 'cardGuessBlind' | 'cardGuess4Choice';

interface CardItem {
  cardId: string;
  cardName: string;
  type: string;
  text: string;
  tag: string;
}

export default function Minigame() {
  const [activeGame, setActiveGame] = useState<MinigameState>('menu');

  const [cards, setCards] = useState<CardItem[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const [currentCard, setCurrentCard] = useState<CardItem | null>(null);
  const [inputName, setInputName] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'correct' | 'perfect' | 'incorrect' | 'partial' | 'skipped'>('playing');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [revealed, setRevealed] = useState<{
    idFirstChar: boolean; category: boolean; idNumber: boolean; cardType: boolean;
    onPlayEffect: boolean; textRevealCount: number; tags: boolean[]; 
  }>({
    idFirstChar: false, category: false, idNumber: false, cardType: false,
    onPlayEffect: false, textRevealCount: 0, tags: [],
  });

  // ✨ 選択肢に label (表示する文字列) と detail (回答後に表示する補足情報) を持たせるように拡張
  const [fcState, setFcState] = useState<{
    status: 'playing' | 'answered';
    type: 1 | 2 | 3;
    questionText: string;
    contentText: string;
    options: { label: string; detail: string }[];
    correctAnswer: string;
    selectedIndex: number | null;
  } | null>(null);
  const [fcStreakCount, setFcStreakCount] = useState<number>(0);

  // 🎲 ランダム遷移用の状態
  const [isRandomTransferring, setIsRandomTransferring] = useState<boolean>(false);
  const [transferNumber, setTransferNumber] = useState<string>('');
  const [transferProgress, setTransferProgress] = useState<number>(0);

  const fetchCards = () => {
    setLoadingCards(true);
    setCardsError(null);
    fetch('/api/players?type=cards')
      .then((res) => {
        if (!res.ok) throw new Error('カードデータの取得に失敗しました');
        return res.json();
      })
      .then((resData) => {
        if (resData.error) throw new Error(resData.error);
        setCards(resData.data || []);
        setLoadingCards(false);
      })
      .catch((err) => {
        setCardsError(err.message);
        setLoadingCards(false);
      });
  };

  useEffect(() => {
    if ((activeGame === 'cardGuessBlind' || activeGame === 'cardGuess4Choice') && cards.length === 0) {
      fetchCards();
    }
  }, [activeGame]);

  const formatFirstChar = (id: string) => {
    if (!id) return '';
    const first = id.charAt(0);
    if (first === 'e') return 'ex';
    if (first === 'p') return 'prm';
    return first;
  };

  const getCategoryChar = (id: string) => {
    if (!id || !id.includes('-')) return '';
    return id.split('-')[0].slice(-1).toUpperCase();
  };

  const formatCategory = (id: string) => {
    const lastChar = getCategoryChar(id);
    switch (lastChar) {
      case 'A': return 'Artist';
      case 'S': return 'Song';
      case 'M': return 'Magic';
      case 'D': return 'Direction';
      default: return `その他 (${lastChar})`;
    }
  };

  const formatIdNumber = (id: string) => {
    if (!id) return '';
    const parts = id.split('-');
    return parts.length > 1 ? parts[1] : id;
  };

  const formatOnPlayEffect = (text: string) => {
    if (!text) return '-';
    const match = text.match(/【登場時効果】([^\r\n]*)/);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
    return '-';
  };

  const startNewQuestion = (allCards: CardItem[]) => {
    if (allCards.length === 0) return;
    const selected = allCards[Math.floor(Math.random() * allCards.length)];
    setCurrentCard(selected);
    setInputName('');
    setGameStatus('playing');
    const tagList = selected.tag ? selected.tag.split('/').filter(t => t.trim()) : [];
    setRevealed({
      idFirstChar: false, category: false, idNumber: false, cardType: false,
      onPlayEffect: false, textRevealCount: 0, tags: new Array(tagList.length).fill(false),
    });
  };

  useEffect(() => {
    if (activeGame === 'cardGuessBlind' && cards.length > 0) {
      startNewQuestion(cards);
    }
  }, [activeGame, cards]);

  const revealAllHints = (card: CardItem) => {
    const tagList = card.tag ? card.tag.split('/').filter(t => t.trim()) : [];
    setRevealed({
      idFirstChar: true, category: true, idNumber: true, cardType: true,
      onPlayEffect: true, textRevealCount: 999, tags: new Array(tagList.length).fill(true),
    });
  };

  const checkAnswerDetailed = (userInput: string, correctName: string) => {
    const normalizeStr = (str: string) => {
      if (!str) return '';
      return str.normalize('NFKC').replace(/[\s \r\n\t\u200b\u200c\u200d\ufeff]/g, '').toLowerCase();
    };
    if (!userInput.trim()) return 'EMPTY';

    const cleanUserBase = normalizeStr(userInput);
    const cleanCorrectBase = normalizeStr(correctName);

    const userHasSR = cleanUserBase.includes('[sr]');
    const correctHasSR = cleanCorrectBase.includes('[sr]');
    if (userHasSR && !correctHasSR) return 'INCORRECT';

    const cleanUser = cleanUserBase.replace(/\[sr\]/g, '');
    const cleanCorrect = cleanCorrectBase.replace(/\[sr\]/g, '');

    let status = 'INCORRECT';
    let matchPerfect = false;

    if (cleanCorrect.includes('【') && cleanCorrect.includes('】')) {
      if (cleanUser === cleanCorrect) {
        status = 'PERFECT';
        matchPerfect = true;
      }
      const matches = [...cleanCorrect.matchAll(/【(.*?)】/g)];
      const insidesList = matches.map(m => m[1]);
      const bracketsWithInsides = matches.map(m => m[0]);
      const outsideString = cleanCorrect.replace(/【.*?】/g, '');

      if (!matchPerfect) {
        if (insidesList.some(inside => cleanUser === inside) || bracketsWithInsides.some(b => cleanUser === b)) {
          status = 'CORRECT';
        } else if (outsideString.length > 0 && cleanUser === outsideString) {
          status = 'CORRECT';
        }
      }
    } else {
      if (cleanUser === cleanCorrect) {
        status = 'CORRECT';
      }
    }

    if (status === 'INCORRECT' && cleanCorrect.includes(cleanUser)) {
      status = 'PARTIAL';
    }
    return status;
  };

  const isResolved = gameStatus === 'correct' || gameStatus === 'perfect' || gameStatus === 'skipped';

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || isResolved) return;
    const status = checkAnswerDetailed(inputName, currentCard.cardName);

    if (status === 'PERFECT' || status === 'CORRECT') {
      setGameStatus(status === 'PERFECT' ? 'perfect' : 'correct');
      setStreakCount(prev => prev + 1);
      revealAllHints(currentCard);
    } else if (status === 'PARTIAL') {
      setGameStatus('partial');
    } else {
      setGameStatus('incorrect');
    }
  };

  const handleSkip = () => {
    if (!currentCard) return;
    setGameStatus('skipped');
    setStreakCount(0);
    revealAllHints(currentCard);
  };

  const currentTags = currentCard?.tag ? currentCard.tag.split('/').filter(t => t.trim()) : [];
  const textChunks = currentCard?.text 
    ? currentCard.text.replace(/。/g, '。__SEP__').replace(/\r?\n/g, '\n__SEP__').split('__SEP__').filter(t => t !== '') 
    : [];

  const generateFcQuestion = (allCards: CardItem[]) => {
    if (allCards.length === 0) return;

    const artistCards = allCards.filter(c => getCategoryChar(c.cardId) === 'A');
    const availableTypes = artistCards.length >= 4 ? [1, 2, 3] : [1, 2];
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)] as 1 | 2 | 3;

    let correctCard: CardItem;
    if (type === 3) {
      correctCard = artistCards[Math.floor(Math.random() * artistCards.length)];
    } else {
      correctCard = allCards[Math.floor(Math.random() * allCards.length)];
    }

    const categoryChar = getCategoryChar(correctCard.cardId);
    const sameCategoryCards = allCards.filter(c => getCategoryChar(c.cardId) === categoryChar && c.cardId !== correctCard.cardId);

    let questionText = '';
    let contentText = '';
    let options: { label: string; detail: string }[] = [];
    let correctAnswer = '';

    if (type === 1) {
      questionText = 'この効果のカード名は何？';
      contentText = correctCard.text || '(効果なし)';
      correctAnswer = correctCard.cardName;
      
      const validWrongs = sameCategoryCards.filter(c => c.text !== correctCard.text && c.cardName !== correctCard.cardName);
      const uniqueWrongsMap = new Map<string, CardItem>();
      validWrongs.forEach(c => {
        if (!uniqueWrongsMap.has(c.cardName)) uniqueWrongsMap.set(c.cardName, c);
      });
      const shuffledWrongs = Array.from(uniqueWrongsMap.values()).sort(() => 0.5 - Math.random()).slice(0, 3);
      
      while (shuffledWrongs.length < 3) {
        const fallback = allCards.filter(c => c.cardName !== correctCard.cardName && !shuffledWrongs.some(w => w.cardName === c.cardName));
        if (fallback.length > 0) shuffledWrongs.push(fallback[Math.floor(Math.random() * fallback.length)]);
        else break;
      }
      const rawOptions = [correctCard, ...shuffledWrongs].sort(() => 0.5 - Math.random());
      
      // ✨ 回答後に正体（効果テキスト）を表示できるよう detail にセット
      options = rawOptions.map(c => ({ label: c.cardName, detail: c.text || '(効果なし)' }));
      
    } else if (type === 2) {
      questionText = 'このカードの効果は何？';
      contentText = correctCard.cardName;
      correctAnswer = correctCard.text || '(効果なし)';
      
      let hardWrongCard: CardItem | null = null;

      if (categoryChar === 'A') {
        const getOutside = (name: string) => {
          const m = name.match(/【.*?】(.*)/);
          return m ? m[1].replace(/[\s ]/g, '') : name.replace(/[\s ]/g, '');
        };
        const correctOutside = getOutside(correctCard.cardName);

        if (correctOutside) {
          const hardWrongPool = sameCategoryCards.filter(c => 
            getOutside(c.cardName) === correctOutside && 
            (c.text || '(効果なし)') !== correctAnswer
          );
          if (hardWrongPool.length > 0) {
            hardWrongCard = hardWrongPool[Math.floor(Math.random() * hardWrongPool.length)];
          }
        }
      }

      const validWrongs = sameCategoryCards.filter(c => 
        (c.text || '(効果なし)') !== correctAnswer &&
        (!hardWrongCard || (c.text || '(効果なし)') !== (hardWrongCard.text || '(効果なし)'))
      );
      const uniqueWrongsMap = new Map<string, CardItem>();
      validWrongs.forEach(c => {
        if (!uniqueWrongsMap.has(c.text || '(効果なし)')) uniqueWrongsMap.set(c.text || '(効果なし)', c);
      });
      const shuffledWrongs = Array.from(uniqueWrongsMap.values()).sort(() => 0.5 - Math.random()).slice(0, hardWrongCard ? 2 : 3);
      
      if (hardWrongCard) {
        shuffledWrongs.push(hardWrongCard);
      }
      
      while (shuffledWrongs.length < 3) {
        const fallback = allCards.filter(c => (c.text || '(効果なし)') !== correctAnswer && !shuffledWrongs.some(w => (w.text || '(効果なし)') === (c.text || '(効果なし)')));
        if (fallback.length > 0) shuffledWrongs.push(fallback[Math.floor(Math.random() * fallback.length)]);
        else break;
      }
      const rawOptions = [correctCard, ...shuffledWrongs].sort(() => 0.5 - Math.random());
      
      // ✨ 回答後に正体（カード名）を表示できるよう detail にセット
      options = rawOptions.map(c => ({ label: c.text || '(効果なし)', detail: c.cardName }));
      
    } else if (type === 3) {
      questionText = 'このカードの登場時効果は何？';
      contentText = correctCard.cardName;
      // 3番は固定選択肢のため detail は空
      options = ['α', 'β', 'ΩまたはVOL', 'なし'].map(label => ({ label, detail: '' }));
      
      const index = correctCard.text ? correctCard.text.indexOf('【登場時効果】') : -1;
      if (index !== -1) {
        const afterText = correctCard.text.slice(index + 7);
        if (afterText.startsWith('魔力α')) correctAnswer = 'α';
        else if (afterText.startsWith('魔力β')) correctAnswer = 'β';
        else if (afterText.startsWith('魔力Ω') || afterText.startsWith('VOL')) correctAnswer = 'ΩまたはVOL';
        else correctAnswer = 'なし';
      } else {
        correctAnswer = 'なし';
      }
    }

    setFcState({
      status: 'playing',
      type,
      questionText,
      contentText,
      options,
      correctAnswer,
      selectedIndex: null
    });
  };

  useEffect(() => {
    if (activeGame === 'cardGuess4Choice' && cards.length > 0 && !fcState) {
      generateFcQuestion(cards);
    }
  }, [activeGame, cards, fcState]);

  // 🎲 ランダム遷移の実行ハンドラ
  const handleRandomTransfer = () => {
    if (isRandomTransferring) return;

    setIsRandomTransferring(true);
    setTransferProgress(0);

    const min = 46;
    const max = 4000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    const formattedNum = String(randomNum).padStart(4, '0');
    setTransferNumber(formattedNum);

    const interval = setInterval(() => {
      setTransferProgress(prev => Math.min(prev + 25, 100)); // 100 / (400 / 100)
    }, 100); // 100msごとに更新

    setTimeout(() => {
      clearInterval(interval);
      window.open(`https://tcg.kamitsubaki.jp/news/${formattedNum}/`, '_blank');
      setIsRandomTransferring(false);
    }, 750);
  };

  if (activeGame === 'random') {
    return (
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>公式サイトランダム遷移</h3>
          <button onClick={() => setActiveGame('menu')} style={{ background: 'none', border: 'none', color: '#0070f3', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>◀ メニューへ</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
          {!isRandomTransferring ? (
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', margin: 0 }}>公式ページのランダムな記事へジャンプします。画像のみが表示される場合や、404エラーが発生する場合があります。やりすぎると公式サイトが落ちることがあるのでほどほどに</p>
          ) : (
            <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: '#333', fontWeight: 'bold' }}>
                ページ値: <span style={{ fontSize: '18px', color: '#0070f3', letterSpacing: '2px' }}>{transferNumber}</span>
              </div>
            </div>
          )}
          <button 
            onClick={handleRandomTransfer} 
            disabled={isRandomTransferring}
            style={{ 
              width: '100%', maxWidth: '280px', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: '#fff',
              background: isRandomTransferring 
                ? `linear-gradient(to right, #0070f3 ${transferProgress}%, #9ac2f4 ${transferProgress}%)`
                : '#0070f3',
              border: 'none', borderRadius: '16px', cursor: isRandomTransferring ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s'
            }}
          >
            {isRandomTransferring ? '転移中...' : 'ランダムなページへ飛ぶ 🚀'}
          </button>
        </div>
      </div>
    );
  }

  if (activeGame === 'cardGuessBlind') {
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>ヒントカード当て</h3>
          <button onClick={() => setActiveGame('menu')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>◀ 終了</button>
        </div>

        {streakCount >= 3 && (
          <div style={{ textAlign: 'center', color: '#e53e3e', fontWeight: 'bold', fontSize: '15px' }}>
            🔥 現在 {streakCount} 連答中！
          </div>
        )}

        {loadingCards ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#888', fontSize: '14px' }}>カードデータを同期中...</div>
        ) : cardsError ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#df4759', fontSize: '14px', fontWeight: 'bold' }}>⚠️ エラー: {cardsError}</div>
        ) : !currentCard ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: '14px' }}>データがありません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <form onSubmit={handleCheckAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '16px', border: '1px solid #e9ecef' }}>
              <input 
                type="text" 
                placeholder="カード名を入力してください"
                value={isResolved ? currentCard.cardName : inputName}
                onChange={(e) => setInputName(e.target.value)}
                disabled={isResolved}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ced4da', fontSize: '15px', textAlign: 'center', outline: 'none', 
                  backgroundColor: isResolved ? '#e8f5e9' : '#fff',
                  color: isResolved ? '#2e7d32' : '#333',
                  fontWeight: isResolved ? 'bold' : 'normal'
                }}
              />
              
              {gameStatus === 'perfect' && <div style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>🎉 完答です！とても素晴らしい！！</div>}
              {gameStatus === 'correct' && <div style={{ color: '#2e7d32', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>🎉 正解です！素晴らしい！</div>}
              {gameStatus === 'partial' && <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>⚠️ 部分一致です。惜しい！</div>}
              {gameStatus === 'incorrect' && <div style={{ color: '#df4759', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>❌ 違います！ヒントを開けてみましょう。</div>}
              {gameStatus === 'skipped' && <div style={{ color: '#c2410c', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>⏭️ スキップしました（答えを表示中）</div>}

              <div style={{ display: 'flex', gap: '8px' }}>
                {!isResolved ? (
                  <>
                    <button type="button" onClick={handleSkip} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#495057', backgroundColor: '#e9ecef', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>確認 (パス)</button>
                    <button type="submit" style={{ flex: 2, padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0070f3', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>判定</button>
                  </>
                ) : (
                  <button type="button" onClick={() => startNewQuestion(cards)} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#fff', backgroundColor: '#2e7d32', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>次の問題へ ➔</button>
                )}
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', paddingLeft: '2px' }}>タップしてヒントを開放：</span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div onClick={() => !isResolved && setRevealed({ ...revealed, category: true })} style={{ padding: '10px', borderRadius: '10px', border: '1px dashed #ccc', backgroundColor: revealed.category ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'), cursor: isResolved ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#777', display: 'block', marginBottom: '2px' }}>カード種別</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: revealed.category || isResolved ? '#d97706' : '#bbb' }}>{revealed.category || isResolved ? formatCategory(currentCard.cardId) : '❓'}</span>
                </div>
                <div onClick={() => !isResolved && setRevealed({ ...revealed, cardType: true })} style={{ padding: '10px', borderRadius: '10px', border: '1px dashed #ccc', backgroundColor: revealed.cardType ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'), cursor: isResolved ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#777', display: 'block', marginBottom: '2px' }}>タイプ</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: revealed.cardType || isResolved ? '#e53e3e' : '#bbb' }}>{revealed.cardType || isResolved ? (currentCard.type || 'なし') : '❓'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div onClick={() => !isResolved && setRevealed({ ...revealed, idFirstChar: true })} style={{ padding: '10px', borderRadius: '10px', border: '1px dashed #ccc', backgroundColor: revealed.idFirstChar ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'), cursor: isResolved ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#777', display: 'block', marginBottom: '2px' }}>収録弾</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: revealed.idFirstChar || isResolved ? '#0070f3' : '#bbb', wordBreak: 'break-all' }}>{revealed.idFirstChar || isResolved ? formatFirstChar(currentCard.cardId) : '❓'}</span>
                </div>
                <div onClick={() => !isResolved && setRevealed({ ...revealed, idNumber: true })} style={{ padding: '10px', borderRadius: '10px', border: '1px dashed #ccc', backgroundColor: revealed.idNumber ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'), cursor: isResolved ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#777', display: 'block', marginBottom: '2px' }}>ID番号</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: revealed.idNumber || isResolved ? '#0070f3' : '#bbb', wordBreak: 'break-all' }}>{revealed.idNumber || isResolved ? formatIdNumber(currentCard.cardId) : '❓'}</span>
                </div>
                <div onClick={() => !isResolved && setRevealed({ ...revealed, onPlayEffect: true })} style={{ padding: '10px', borderRadius: '10px', border: '1px dashed #ccc', backgroundColor: revealed.onPlayEffect ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'), cursor: isResolved ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#777', display: 'block', marginBottom: '2px' }}>登場時効果</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: revealed.onPlayEffect || isResolved ? '#805ad5' : '#bbb', wordBreak: 'break-all' }}>{revealed.onPlayEffect || isResolved ? formatOnPlayEffect(currentCard.text) : '❓'}</span>
                </div>
              </div>

              {currentTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
                  {currentTags.map((tag, idx) => {
                    const isTagRevealed = revealed.tags[idx];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => !isResolved && setRevealed({ ...revealed, tags: revealed.tags.map((t, i) => i === idx ? true : t) })}
                        style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #dee2e6', backgroundColor: isTagRevealed ? '#fff' : (isResolved ? '#e8f5e9' : '#f8f9fa'), cursor: isResolved ? 'default' : 'pointer', fontSize: '12px', fontWeight: 'bold', color: isTagRevealed || isResolved ? '#2e7d32' : '#999' }}
                      >
                        {isTagRevealed || isResolved ? `# ${tag}` : `🏷️ タグヒント ${idx + 1}`}
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                onClick={() => { if (!isResolved && revealed.textRevealCount < textChunks.length) { setRevealed({ ...revealed, textRevealCount: revealed.textRevealCount + 1 }); } }}
                style={{
                  padding: '12px', borderRadius: '10px', border: '1px dashed #ccc',
                  backgroundColor: revealed.textRevealCount > 0 ? '#fff' : (isResolved ? '#e8f5e9' : '#f1f3f5'),
                  cursor: isResolved || revealed.textRevealCount >= textChunks.length ? 'default' : 'pointer',
                  transition: 'all 0.2s', minHeight: '80px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#777' }}>効果テキスト</span>
                  <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 'bold' }}>({isResolved ? textChunks.length : Math.min(revealed.textRevealCount, textChunks.length)}/{textChunks.length})</span>
                </div>
                
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: revealed.textRevealCount > 0 || isResolved ? '#333' : '#bbb', whiteSpace: 'pre-wrap' }}>
                  {revealed.textRevealCount === 0 && !isResolved ? (
                    <span style={{ fontStyle: 'italic' }}>❓ タップしてテキストを少しずつ展開</span>
                  ) : (
                    <>
                      {textChunks.slice(0, revealed.textRevealCount).join('')}
                      {revealed.textRevealCount < textChunks.length && (
                        <span style={{ color: '#0070f3', fontWeight: 'bold', fontSize: '12px', marginLeft: '6px' }}>▶ タップで続きを表示</span>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeGame === 'cardGuess4Choice') {
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>4択カード当て</h3>
          <button onClick={() => { setActiveGame('menu'); setFcState(null); }} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>◀ 終了</button>
        </div>

        {fcStreakCount >= 3 && (
          <div style={{ textAlign: 'center', color: '#e53e3e', fontWeight: 'bold', fontSize: '15px' }}>
            🔥 現在 {fcStreakCount} 連答中！
          </div>
        )}

        {loadingCards ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#888', fontSize: '14px' }}>カードデータを同期中...</div>
        ) : cardsError ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#df4759', fontSize: '14px', fontWeight: 'bold' }}>⚠️ エラー: {cardsError}</div>
        ) : !fcState ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: '14px' }}>問題を生成しています...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 問題文とテキスト枠 */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0070f3', marginBottom: '8px' }}>Q. {fcState.questionText}</div>
              <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {fcState.contentText}
              </div>
            </div>

            {/* 正誤判定と次の問題へボタン */}
            {fcState.status === 'answered' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', animation: 'fadeIn 0.3s' }}>
                {fcState.options[fcState.selectedIndex!].label === fcState.correctAnswer ? (
                  <div style={{ color: '#2e7d32', fontSize: '15px', fontWeight: 'bold' }}>🎉 正解！</div>
                ) : (
                  <div style={{ color: '#df4759', fontSize: '15px', fontWeight: 'bold' }}>❌ 残念...</div>
                )}
                <button 
                  onClick={() => generateFcQuestion(cards)} 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', color: '#fff', backgroundColor: '#0070f3', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,112,243,0.2)' }}
                >
                  次の問題へ ➔
                </button>
              </div>
            )}

            {/* 4つの選択肢ボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fcState.options.map((optObj, idx) => {
                const opt = optObj.label;
                const isAnswered = fcState.status === 'answered';
                const isSelected = fcState.selectedIndex === idx;
                const isCorrectOption = opt === fcState.correctAnswer;
                
                let bgColor = '#fff';
                let textColor = '#333';
                let borderColor = '#e2e8f0';
                let fontWeight = 'normal';

                if (isAnswered) {
                  if (isCorrectOption) {
                    bgColor = '#e8f5e9'; textColor = '#2e7d32'; borderColor = '#2e7d32'; fontWeight = 'bold';
                  } else if (isSelected) {
                    bgColor = '#fff0f2'; textColor = '#df4759'; borderColor = '#df4759'; fontWeight = 'bold';
                  } else {
                    bgColor = '#f1f3f5'; textColor = '#adb5bd'; borderColor = '#e9ecef';
                  }
                }

                return (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (!isAnswered) {
                        const isCorrect = opt === fcState.correctAnswer;
                        if (isCorrect) {
                          setFcStreakCount(prev => prev + 1);
                        } else {
                          setFcStreakCount(0);
                        }
                        setFcState(prev => prev ? ({ ...prev, status: 'answered', selectedIndex: idx }) : null);
                      }
                    }}
                    style={{ 
                      padding: '14px', borderRadius: '12px', border: `2px solid ${borderColor}`, 
                      backgroundColor: bgColor, color: textColor, fontSize: '14px', fontWeight,
                      textAlign: 'left', cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.2s',
                      lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                    }}
                  >
                    <div>{opt}</div>
                    
                    {/* ✨ 誤答の選択肢に「正体（カード名/効果）」を種明かしとして表示 */}
                    {isAnswered && !isCorrectOption && optObj.detail && (
                      <div style={{ 
                        marginTop: '10px', 
                        fontSize: '12px', 
                        color: isSelected ? '#c92a2a' : '#868e96', 
                        fontWeight: 'normal', 
                        borderTop: `1px dashed ${isSelected ? '#ffa8a8' : '#dee2e6'}`, 
                        paddingTop: '8px' 
                      }}>
                        {optObj.detail}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ backgroundColor: '#fff', padding: '14px 18px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>ミニゲームメニュー</h3>
        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>遊びたいゲームを選択してください</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => setActiveGame('random')} style={{ width: '100%', padding: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>ランダム遷移</span>
        </button>
        <button onClick={() => setActiveGame('cardGuessBlind')} style={{ width: '100%', padding: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>ヒントカード当て</span>
        </button>
        <button onClick={() => setActiveGame('cardGuess4Choice')} style={{ width: '100%', padding: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>4択カード当て</span>
        </button>
      </div>
    </div>
  );
}