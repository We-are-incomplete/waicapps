// app/components/Seserigame2.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import type { MinigameState } from './Minigame';

// Define the card type
type Card = {
  id: number;
  value: number; // The value that determines a match
  isFlipped: boolean;
  isMatched: boolean;
};

interface Seserigame2Props {
  setActiveGame: (state: MinigameState) => void;
}

export default function Seserigame2({ setActiveGame }: Seserigame2Props) {
  const [playerCount, setPlayerCount] = useState<number>(3); // State for player count
  const [showRules, setShowRules] = useState<boolean>(false); // State for showing rules
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // New states for card selection game
  const [gamePhase, setGamePhase] = useState<'setup' | 'selection' | 'memory'>('setup');
  const [currentRound, setCurrentRound] = useState<number>(0); // 0-indexed player turn
  const [selectedCards, setSelectedCards] = useState<{ card: number; color: string }[]>([]); // Array to store chosen cards with color
  const [currentSelection, setCurrentSelection] = useState<number | null>(null); // Current card selected by player

  const playerColors = ['#ffa4be', '#262182', '#e33660', '#f8eee3', '#44cd85']; // Define player colors

  const handleStartGame = () => {
    setGamePhase('selection');
    setCurrentRound(0); // Start with the first player
    setSelectedCards([]); // Reset selected cards
    setCurrentSelection(null); // Reset current selection
    console.log(`ゲーム開始！人数: ${playerCount}人`);
  };

  const handleCardSelect = (cardNumber: number) => {
    setCurrentSelection(cardNumber);
  };

  const [cards, setCards] = useState<Card[]>([]); // State for memory game cards

  // Function to create and shuffle cards for the memory game
  const createShuffledCards = (): Card[] => {
    const values: number[] = [];
    // Create 18 pairs of cards
    for (let i = 1; i <= 18; i++) {
      values.push(i, i);
    }

    // Fisher-Yates shuffle
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    return values.map((value, index) => ({
      id: index,
      value: value,
      isFlipped: false,
      isMatched: false,
    }));
  };

  // Effect to setup the game board when memory phase starts
  useEffect(() => {
    if (gamePhase === 'memory') {
      setCards(createShuffledCards());
    }
  }, [gamePhase]);

  const handleCardConfirm = () => {
    if (currentSelection === null) {
      alert('カードを選んでください！');
      return;
    }

    // Store card with player's color
    const newSelectedCards = [...selectedCards, { card: currentSelection, color: playerColors[currentRound] }];
    setSelectedCards(newSelectedCards);
    setCurrentSelection(null); // Reset selection for next player

    if (currentRound + 1 < playerCount) {
      // Move to next player
      setCurrentRound(prev => prev + 1);
    } else {
      // All players have chosen their cards, transition to the memory game
      setGamePhase('memory'); // Transition to memory game phase
    }
  };

  if (gamePhase === 'selection') {
    // Player card selection phase
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>俺が一番推している</h3>
          <button onClick={() => setActiveGame('menu')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>◀ 終了</button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#0070f3' }}>
          プレイヤー {currentRound + 1} の番です！
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
          7枚のカードから1枚を選んでください。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((cardNumber) => (
            <button
              key={cardNumber}
              onClick={() => handleCardSelect(cardNumber)}
              style={{
                padding: '20px 10px',
                borderRadius: '10px',
                border: `2px solid ${currentSelection === cardNumber ? '#0070f3' : '#e2e8f0'}`,
                backgroundColor: currentSelection === cardNumber ? '#e0f2fe' : '#fff',
                color: '#333',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cardNumber}
            </button>
          ))}
        </div>

        <button
          onClick={handleCardConfirm}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#28a745',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(40,167,69,0.2)',
            transition: 'background-color 0.2s',
            marginTop: '10px',
          }}
        >
          OK
        </button>
      </div>
    );
  } else if (gamePhase === 'memory') {
    // Memory game phase
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>神経衰弱</h3>
          <button onClick={() => setActiveGame('menu')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>◀ 終了</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                width: '50px',
                height: '70px',
                backgroundColor: card.isFlipped ? '#e2e8f0' : '#252235',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.isFlipped ? '#333' : '#fff',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s, transform 0.3s',
                transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {card.isFlipped ? card.value : ''}
            </div>
          ))}
        </div>

        <button
          onClick={() => setGamePhase('setup')} // Go back to game setup menu
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#0070f3',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,112,243,0.2)',
            transition: 'background-color 0.2s',
            marginTop: '10px',
          }}
        >
          ゲーム設定に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>俺が一番推している</h3>
        <button onClick={() => setActiveGame('menu')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>◀ 終了</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 人数選択 */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>プレイ人数を選んでね</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setPlayerCount(num)}
                style={{
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: `1px solid ${playerCount === num ? '#0070f3' : '#e2e8f0'}`,
                  backgroundColor: playerCount === num ? '#e0f2fe' : '#fff',
                  color: playerCount === num ? '#0070f3' : '#333',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {num}人
              </button>
            ))}
          </div>
        </div>

        {/* ルール説明 */}
        <div>
          <button
            onClick={() => setShowRules(!showRules)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8f9fa',
              color: '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>ルール説明</span>
            <span style={{ fontSize: '18px' }}>{showRules ? '▲' : '▼'}</span>
          </button>
          {showRules && (
            <div style={{
              marginTop: '12px',
              padding: '15px',
              backgroundColor: '#f0f4f8',
              borderRadius: '8px',
              border: '1px solid #cce0f0',
              fontSize: '13px',
              color: '#555',
              lineHeight: '1.6',
            }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>ゲームルール: 俺が一番推している</h5>
              <ul style={{ margin: '0 0 5px 0', paddingLeft: '20px' }}>
                <li>■コンセプト</li>
                <li>盛り上がりすぎたライブ会場</li>
                <li></li>
                <li>■人数</li>
                <li>3〜5人</li>
                <li></li>
                <li>■準備</li>
                <li>◇各プレイヤーは7種のカードから1枚を選びます。自分の前に伏せて置き、他の人にはゲーム終了まで公開しません。</li>
                <li>◇全てのプレイヤーの残りの6枚を混ぜて場に並べます。</li>
                <li></li>
                <li>■ゲーム進行</li>
                <li>◇プレイヤー1から時計回りに手番を進めます。</li>
                <li>◇自分の手番で2枚のカードをめくり、両方の色が自分の色と一致していれば回収します。</li>
                <li>◇1枚以上が自分の色ではなかった場合、それぞれのカードの効果を、めくられた色のプレイヤーが受けます。</li>
                <li></li>
                <li>■終了条件</li>
                <li>◇誰かが自分の色のカード全てを回収すること。回収した人の勝利です。</li>
                <li></li>
                <li>■カードの種類</li>
                <li>😍盲目なファン</li>
                <li>この色のプレイヤーは自分の番の開始まで目を瞑る。</li>
                <li></li>
                <li>🫣照れ屋なファン</li>
                <li>めくったカードを隣合った好きなカードと入れ替える。(めくられた色と同じファンは入れ替えるまで目を瞑る)</li>
                <li></li>
                <li>↕縦揺れファン</li>
                <li>めくられたカードの縦一列を上か下に一つずらす。</li>
                <li></li>
                <li>↔横揺れファン</li>
                <li>めくられたカードの横一列を右か左に一つずらす。</li>
                <li></li>
                <li>😎腕組みファン</li>
                <li>同じ列の1番後ろに動かす。</li>
                <li></li>
                <li>🥳コールファン</li>
                <li>この色のプレイヤーは次の自分の番でカードを回収できれば、その後もう一度自分の番を行う。回収できなかったら次の自分の番の開始まで目を瞑る。</li>
                <li></li>
                <li>🫣ネタバレファン</li>
                <li>めくられたら回収されるまで裏返さない。</li>
                <li>この色のプレイヤーは、このカードと色が揃って回収するまで自分の番で1枚しかめくれない。</li>
              </ul>
              <p style={{ margin: 0 }}>詳細はゲーム開始後に案内されます。</p>
            </div>
          )}
        </div>

        {/* ゲームを始めるボタン */}
        <button
          onClick={handleStartGame}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#0070f3',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,112,243,0.2)',
            transition: 'background-color 0.2s',
          }}
        >
          ゲームを始める
        </button>
      </div>
    </div>
  );
}
