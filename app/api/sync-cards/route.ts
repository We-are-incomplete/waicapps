import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const WARNING_HEADER = { 'X-Usage-Warning': 'This API is for internal use only.' };

function getGoogleAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function normalizeCardId(id: string): string {
  if (!id) return '';
  return id
    .trim()
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('X-API-KEY');
  if (apiKey !== process.env.NEXT_PUBLIC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized: API Key mismatch' }, { status: 401, headers: WARNING_HEADER });
  }

  try {
    const targetUrl = 'https://tcg.kamitsubaki.jp/cardlist/';
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Official site fetch failed with status ${res.status}` }, { status: 500, headers: WARNING_HEADER });
    }
    const html = await res.text();

    const scrapedMap = new Map<string, string>();
    const cardDivs = html.split('<div id="card_');

    for (let i = 1; i < cardDivs.length; i++) {
      const block = cardDivs[i];
      const internalIdMatch = block.match(/data-card="(\d+)"/);
      const cardCodeMatch = block.match(/<div class="card_code">([^<]+)<\/div>/);

      if (internalIdMatch && cardCodeMatch) {
        const internalId = internalIdMatch[1];
        const cardCode = normalizeCardId(cardCodeMatch[1]);
        scrapedMap.set(cardCode, internalId);
      }
    }

    if (scrapedMap.size === 0) {
      return NextResponse.json({ error: 'No cards matched the parsing rule from HTML.' }, { status: 400, headers: WARNING_HEADER });
    }

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Cardlist!A1:A',
    });
    const rows = existingRes.data.values || [];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cardlist sheet is empty or A column has no IDs.' }, { status: 400, headers: WARNING_HEADER });
    }

    let matchedCount = 0;
    const gColumnValues = rows.map((row) => {
      const cardId = normalizeCardId(row[0]);
      const internalId = scrapedMap.get(cardId) || '';
      if (internalId) matchedCount++;
      return [internalId];
    });

    const unmatchedCount = rows.length - matchedCount;

    // 安全機能：カードリストの最下行のさらに1つ下に「999」を配置
    gColumnValues.push(['999']);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Cardlist!G1:G${gColumnValues.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: gColumnValues },
    });

    return NextResponse.json({ 
      success: true, 
      count: gColumnValues.length - 1, 
      matched: matchedCount, 
      unmatched: unmatchedCount 
    }, { headers: WARNING_HEADER });
  } catch (error: any) {
    console.error('Card Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500, headers: WARNING_HEADER });
  }
}