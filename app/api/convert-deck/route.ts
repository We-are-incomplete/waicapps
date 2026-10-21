import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { 
  encodeKcgMultiWithDebug, 
  formatDeckData, 
  parseDeckData, 
  parseKcgMulti,
  parseKcgMultiWithDebug
} from '@/app/utils/deckConverter';

const WARNING_HEADER = { 'X-Usage-Warning': 'This API is for internal use only.' };
const DEFAULT_BASE_CODE = "YmI5N2_ZlNmMt_OWU1NS"; 

function getGoogleAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function normalizeCardId(id: string): string {
  if (!id) return '';
  return id.trim().replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

function extractCardIdFromImgSrc(imgSrc: string): string {
  if (!imgSrc) return '';
  const match = imgSrc.match(/([a-zA-Z0-9]+-[0-9]+(?:-[0-9]+)?)-\d+x\d+/);
  if (match) return match[1].toUpperCase();
  const match2 = imgSrc.match(/\/([^\/]+)-\d+x\d+\.\w+\$/);
  if (match2) {
    const parts = match2[1].split('_');
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('-')) return lastPart.toUpperCase();
  }
  return '';
}

function compareCardIds(idA: string, idB: string): number {
  const normA = normalizeCardId(idA);
  const normB = normalizeCardId(idB);
  const getSubCategory = (id: string) => {
    const dashIdx = id.lastIndexOf('-');
    return dashIdx > 0 ? id.charAt(dashIdx - 1) : '';
  };
  const subOrder: { [key: string]: number } = { 'A': 1, 'S': 2, 'M': 3, 'D': 4 };
  const orderA = subOrder[getSubCategory(normA)] || 99;
  const orderB = subOrder[getSubCategory(normB)] || 99;
  if (orderA !== orderB) return orderA - orderB;

  const getFirstCharRank = (char: string) => {
    if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 64;
    if (char === 'e') return 27;
    if (char === 'p') return 28;
    return 99;
  };
  const rankA = getFirstCharRank(normA.charAt(0));
  const rankB = getFirstCharRank(normB.charAt(0));
  if (rankA !== rankB) return rankA - rankB;

  const getNum = (id: string) => {
    const idx = id.lastIndexOf('-');
    return idx !== -1 ? (parseInt(id.substring(idx + 1), 10) || 0) : 0;
  };
  return getNum(normA) - getNum(normB);
}

function parseCardsFromHtmlWithDebug(htmlSnippet: string, internalToIdMap: Map<string, string>, debugLogs: string[], sectionName: string) {
  const cardLiRegex = /<li class="card"[^>]*data-card="([^"]*)"[^>]*>([\s\S]*?)<\/li>/g;
  const cardIdList: string[] = [];
  const missingCards: any[] = [];
  let match;

  debugLogs.push(`[HTML Parse (${sectionName})] Starting regex match on HTML snippet (length: ${htmlSnippet.length})`);

  let countMatched = 0;
  while ((match = cardLiRegex.exec(htmlSnippet)) !== null) {
    countMatched++;
    const internalId = match[1];
    const liInner = match[2];
    const imgSrcMatch = liInner.match(/<img[^>]*src="([^"]*)"/);
    const imgSrc = imgSrcMatch ? imgSrcMatch[1] : '';
    const countMatch = liInner.match(/<div class="count">([^<]*)<\/div>/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    debugLogs.push(`-> Found card <li> [${countMatched}]: internalId="${internalId}", count=${count}, imgSrc="${imgSrc}"`);

    if (internalId && !isNaN(count)) {
      let cardId = internalToIdMap.get(internalId);
      if (!cardId) {
        const inferredId = extractCardIdFromImgSrc(imgSrc);
        missingCards.push({ internalId, inferredId: inferredId || '不明' });
        cardId = inferredId ? `UNKNOWN(${internalId}:${inferredId})` : `UNKNOWN(${internalId})`;
        debugLogs.push(`   ⚠️ Warning: internalId "${internalId}" not found in sheet map! Inferred: "${cardId}"`);
      } else {
        debugLogs.push(`   ✓ Mapped internalId "${internalId}" -> cardId "${cardId}"`);
      }
      for (let i = 0; i < count; i++) {
        cardIdList.push(cardId);
      }
    }
  }

  debugLogs.push(`[HTML Parse (${sectionName})] Total <li> matched: ${countMatched}, Total cards expanded: ${cardIdList.length}`);
  cardIdList.sort(compareCardIds);
  return { cardIdList, missingCards };
}

function convertToOfficialLocalStorageFormat(cardIds: string[], idToInternalMap: Map<string, string>): Record<string, string> {
  const counts = new Map<string, number>();
  for (const id of cardIds) {
    const cleanId = normalizeCardId(id);
    counts.set(cleanId, (counts.get(cleanId) || 0) + 1);
  }
  const result: Record<string, string> = {};
  counts.forEach((count, cardId) => {
    const internalId = idToInternalMap.get(cardId);
    if (internalId) {
      result[`id${internalId}`] = count.toString();
    }
  });
  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawInputCode = searchParams.get('code');
  const deckNameParam = searchParams.get('deckName');

  const effectiveRawCode = rawInputCode && rawInputCode.trim() ? rawInputCode.trim() : DEFAULT_BASE_CODE;
  const isDebugMode = effectiveRawCode.startsWith('debug-');
  const inputCode = isDebugMode ? effectiveRawCode.replace(/^debug-/, '') : effectiveRawCode;

  try {
    let mainCards: string[] = [];
    let sideCards: string[] = [];
    let missingCards: any[] = [];
    let inputType: 'kcg' | 'deckData' | 'official' = 'official';
    let baseDeckCode = DEFAULT_BASE_CODE;
    let debugProcessLog: string[] = [];

    debugProcessLog.push(`[Init] Effective input code: "${inputCode}", isDebugMode: ${isDebugMode}`);

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    debugProcessLog.push(`[Spreadsheet] Fetching Cardlist sheet...`);
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cardlist!A:G',
    });
    const rows = sheetRes.data.values || [];
    debugProcessLog.push(`[Spreadsheet] Fetched ${rows.length} rows from Cardlist.`);

    let isListValid = true;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const marker = lastRow[6] ? lastRow[6].trim() : '';
      if (marker !== '999') isListValid = false;
    } else {
      isListValid = false;
    }

    const internalToIdMap = new Map<string, string>();
    const idToInternalMap = new Map<string, string>();

    rows.forEach(row => {
      const cardId = normalizeCardId(row[0]);
      const internalId = row[6] ? row[6].trim() : '';
      if (cardId && internalId && internalId !== '999') {
        internalToIdMap.set(internalId, cardId);
        idToInternalMap.set(cardId, internalId);
      }
    });

    if (inputCode.startsWith("KCG-")) {
      inputType = 'kcg';
      debugProcessLog.push(`[Format Detection] Detected as KCG format.`);
      const parsedDebug = parseKcgMultiWithDebug(inputCode);
      mainCards = parsedDebug.main;
      sideCards = parsedDebug.side;
      debugProcessLog.push(...parsedDebug.debugLogs);
      mainCards.sort(compareCardIds);
      sideCards.sort(compareCardIds);
    } else if (inputCode.includes('*side*') || (inputCode.includes('/') && !inputCode.includes('http'))) {
      inputType = 'deckData';
      debugProcessLog.push(`[Format Detection] Detected as DeckData format.`);
      const parsed = parseDeckData(inputCode);
      mainCards = parsed.main;
      sideCards = parsed.side;
      debugProcessLog.push(`[DeckData Parse] Main cards: ${mainCards.length}, Side cards: ${sideCards.length}`);
      mainCards.sort(compareCardIds);
      sideCards.sort(compareCardIds);
    } else {
      inputType = 'official';
      debugProcessLog.push(`[Format Detection] Detected as Official Deck URL/Code format.`);
      
      const codeMatch = inputCode.match(/deck_detail\/([^\/]+)/) || inputCode.match(/deck_create\/([^\/]+)/);
      if (codeMatch) {
        baseDeckCode = codeMatch[1];
      } else {
        baseDeckCode = inputCode;
      }

      const targetUrl = `https://tcg.kamitsubaki.jp/deck_detail/${baseDeckCode}/`;
      debugProcessLog.push(`[Official Parse] Target URL: ${targetUrl}`);

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      debugProcessLog.push(`[Official Parse] Fetch status: ${res.status} ${res.statusText}`);
      if (!res.ok) {
        debugProcessLog.push(`-> Error: Official site fetch failed with status ${res.status}`);
        return NextResponse.json({ error: '指定された公式デッキが見つかりません。' }, { status: 404, headers: WARNING_HEADER });
      }

      const html = await res.text();
      debugProcessLog.push(`[Official Parse] Fetched HTML length: ${html.length} chars`);

      let mainHtml = html;
      let sideHtml = "";
      const sideKeywordIndex = html.indexOf('サイド');
      debugProcessLog.push(`[Official Parse] 'サイド' keyword found at index: ${sideKeywordIndex}`);

      if (sideKeywordIndex !== -1) {
        mainHtml = html.substring(0, sideKeywordIndex);
        sideHtml = html.substring(sideKeywordIndex);
      }

      const mainResult = parseCardsFromHtmlWithDebug(mainHtml, internalToIdMap, debugProcessLog, "MAIN");
      const sideResult = parseCardsFromHtmlWithDebug(sideHtml, internalToIdMap, debugProcessLog, "SIDE");

      mainCards = mainResult.cardIdList;
      sideCards = sideResult.cardIdList;
      missingCards = [...mainResult.missingCards, ...sideResult.missingCards];
      // 💡 タイポを修正 (SideCardsCount -> sideCards.length)
      debugProcessLog.push(`[Official Parse] Final extracted - Main: ${mainCards.length}, Side: ${sideCards.length}, Missing: ${missingCards.length}`);
    }

    const deckDataString = formatDeckData(mainCards, sideCards);
    const kcgDebugResult = encodeKcgMultiWithDebug(mainCards, sideCards);
    const kcgCode = kcgDebugResult.sideKcg ? `${kcgDebugResult.mainKcg}|${kcgDebugResult.sideKcg}` : kcgDebugResult.mainKcg;

    const finalDeckDataOutput = isDebugMode
      ? `=== [DEBUG MODE] 公式パース＆変換プロセスログ ===\n\n` + debugProcessLog.join('\n') + `\n\n=== 抽出されたカード一覧 ===\nMain: ${JSON.stringify(mainCards)}\nSide: ${JSON.stringify(sideCards)}\nMissing: ${JSON.stringify(missingCards)}`
      : deckDataString;

    const finalKcgOutput = isDebugMode
      ? `=== [DEBUG MODE] 再エンコード結果 ===\nMain KCG: ${kcgDebugResult.mainKcg}\nSide KCG: ${kcgDebugResult.sideKcg}`
      : kcgCode;

    const officialMainObj = convertToOfficialLocalStorageFormat(mainCards, idToInternalMap);
    const officialSubObj = convertToOfficialLocalStorageFormat(sideCards, idToInternalMap);

    const effectiveDeckName = deckNameParam ? deckNameParam.trim() : '';

    const payloadData = JSON.stringify({ 
      main: officialMainObj, 
      sub: officialSubObj, 
      deck_name: effectiveDeckName 
    });

    const officialUrlWithHash = `https://tcg.kamitsubaki.jp/deck_create/${baseDeckCode}/#${encodeURIComponent(payloadData)}`;

    const bookmarkletCode = `javascript:(function(){` +
      `try {` +
        `const hash = location.hash.slice(1);` +
        `if(!hash){alert('❌ エラー: ハッシュ（データ）が見つかりません。');return;}` +
        `const data = JSON.parse(decodeURIComponent(hash));` +
        `if(data.main){localStorage.setItem('main_card_list', JSON.stringify(data.main));}` +
        `if(data.sub){localStorage.setItem('sub_card_list', JSON.stringify(data.sub));}` +
        `if(data.deck_name !== undefined){` +
          `localStorage.setItem('deck_name', data.deck_name);` +
        `}` +
        `history.replaceState(null, '', '/deck_create/');` +
        `alert('✨ デッキを正常に反映しました！');` +
        `location.reload();` +
      `} catch(e) {` +
        `alert('❌ エラー詳細: ' + (e.message || e));` +
      `}` +
      `})();`;

    return NextResponse.json({ 
      success: true, 
      inputType, 
      deckData: finalDeckDataOutput,
      kcgCode: finalKcgOutput, 
      officialUrlWithHash, 
      bookmarkletCode,    
      isListValid,
      missingCards,
      debugLog: kcgDebugResult.debug
    }, { headers: WARNING_HEADER });

  } catch (error: any) {
    console.error('[Convert] Error occurred:', error);
    return NextResponse.json({ error: error.message || 'Server internal error' }, { status: 500, headers: WARNING_HEADER });
  }
}