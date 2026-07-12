// app/api/players/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const WARNING_HEADER = { 'X-Usage-Warning': 'This API is for internal use only. Unauthorized access is prohibited.' };

/**
 * APIキーを検証する認証関数
 * @param request - NextRequestオブジェクト
 */
function authenticateRequest(request: NextRequest) {
  const apiKey = request.headers.get('X-API-KEY');
  return apiKey === process.env.NEXT_PUBLIC_API_KEY;
}

function getGoogleAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// 🟩 GET: 対戦履歴、イベント名、またはカードリストを取得
export async function GET(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: WARNING_HEADER });
  }

  const { searchParams } = new URL(request.url);
  const fetchType = searchParams.get('type');

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (fetchType === 'events') {
      // 📅 events シートから取得
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'events!A2:B' });
      const rows = response.data.values || [];
      const events = rows.map((row, index) => ({
        rowIndex: index + 2,
        date: row[0] || '',
        eventName: row[1] || '',
      }));
      return NextResponse.json({ data: events }, { headers: WARNING_HEADER });

    } else if (fetchType === 'cards') {
      // 🃏 ✨ 新設：Cardlist シートから取得
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Cardlist!A2:F' });
      const rows = response.data.values || [];
      
      const cards = rows.map((row) => ({
        cardId: row[0] || '',
        // row[1] (B列) は使用しない
        cardName: row[2] || '',
        type: row[3] || '',
        text: row[4] || '',
        tag: row[5] || '',
      })).filter(card => card.cardId.trim() || card.cardName.trim()); // 空行を除外

      return NextResponse.json({ data: cards }, { headers: WARNING_HEADER });

    } else {
      // ⚔️ 通常の対戦履歴シートから取得
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'A2:F' });
      const rows = response.data.values || [];
      const formattedData = rows.map((row, index) => ({
        rowIndex: index + 2,
        timestamp: row[0] || '',
        date: row[1] || '',
        matchType: row[2] || '',
        opponent: row[3] || '',
        summary: row[4] || '',
        note: row[5] || '',
      }));
      return NextResponse.json({ data: formattedData }, { headers: WARNING_HEADER });
    }
  } catch (error: any) {
    console.error('Google Sheets GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500, headers: WARNING_HEADER });
  }
}

// 🟨 POST: 新規追加
export async function POST(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: WARNING_HEADER });
  }

  try {
    const body = await request.json();
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (body.targetType === 'event') {
      const { date, eventName } = body;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'events!A:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[date, eventName]] },
      });
      return NextResponse.json({ success: true }, { headers: WARNING_HEADER });
    } 
    
    const { date, matchType, opponent, summary, note } = body;
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[timestamp, date, matchType, opponent, summary, note]] },
    });

    return NextResponse.json({ success: true }, { headers: WARNING_HEADER });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to record data' }, { status: 500, headers: WARNING_HEADER });
  }
}

// 🟦 PUT: ✨ 新設：特定行のデータを上書き（編集）
export async function PUT(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: WARNING_HEADER });
  }

  try {
    const body = await request.json();
    const { targetType, rowIndex, date, matchType, opponent, summary, note, eventName, timestamp } = body;
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (targetType === 'event') {
      // 📅 イベントの更新
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `events!A${rowIndex}:B${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[date, eventName]] },
      });
    } else {
      // ⚔️ 通常の対戦履歴の更新
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `A${rowIndex}:F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[timestamp, date, matchType, opponent, summary, note]] },
      });
    }

    return NextResponse.json({ success: true }, { headers: WARNING_HEADER });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500, headers: WARNING_HEADER });
  }
}

// 🟥 DELETE: ✨ 新設：指定された行番号の内容を完全に消去
export async function DELETE(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: WARNING_HEADER });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const rowIndex = parseInt(searchParams.get('rowIndex') || '0');

    if (!rowIndex) return NextResponse.json({ error: 'Invalid Row Index' }, { status: 400, headers: WARNING_HEADER });

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const sheetName = targetType === 'event' ? 'events' : 'Sheet1'; // ※デフォルトのシート名に合わせて適宜変更

    // 指定された行のセルのテキストを綺麗にクリアする
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: targetType === 'event' ? `events!A${rowIndex}:B${rowIndex}` : `A${rowIndex}:F${rowIndex}`,
    });

    return NextResponse.json({ success: true }, { headers: WARNING_HEADER });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500, headers: WARNING_HEADER });
  }
}