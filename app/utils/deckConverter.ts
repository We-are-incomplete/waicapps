const BASE64_CHARS = "AIQYgow5BJRZhpx6CKSaiqy7DLTbjrz8EMUcks19FNVdlt2!GOWemu3?HPXfnv4/";
const EXPANSION_CHARS = "eABCDEFGHIpJKLMNOPQRxSTUVWXYZアyイウエオカキクケコ";

function convertFromSigned10BitBinary(binary: string): number {
    if (binary.length !== 10) throw new Error("Binary string must be 10 bits long.");
    if (binary[0] === '1') {
        return parseInt(binary, 2) - 1024;
    } else {
        return parseInt(binary, 2);
    }
}

function convertToSigned10BitBinary(val: number): string {
    let num = val;
    if (num < 0) {
        num += 1024;
    }
    return num.toString(2).padStart(10, '0');
}

function padCountFromMod(mod: number): number {
    return mod === 0 ? 0 : 6 - mod;
}

function normalizeAndCompleteCardIds(cardIds: string[]): string[] {
    let lastPrefix = "";
    const completedIds: string[] = [];

    for (const id of cardIds) {
        const trimmed = id.trim();
        if (!trimmed) continue;

        let prefix = "";
        let remainder = trimmed;
        const lower = trimmed.toLowerCase();

        if (lower.startsWith("prm")) {
            prefix = "prm";
            remainder = trimmed.substring(3);
        } else if (lower.startsWith("ex")) {
            prefix = "ex";
            remainder = trimmed.substring(2);
        } else if (lower.startsWith("xp")) {
            prefix = "xp";
            remainder = trimmed.substring(2);
        } else if (lower.startsWith("yp")) {
            prefix = "yp";
            remainder = trimmed.substring(2);
        } else {
            const dashIdx = remainder.lastIndexOf('-');
            if (dashIdx !== -1) {
                const typePart = remainder.substring(dashIdx - 1, dashIdx);
                const prefixPart = remainder.substring(0, dashIdx - 1);

                if (["A", "S", "M", "D"].includes(typePart.toUpperCase())) {
                    if (prefixPart) {
                        prefix = prefixPart;
                    } else {
                        prefix = lastPrefix;
                    }
                    remainder = remainder.substring(dashIdx - 1);
                }
            }
        }

        const fullId = prefix ? `${prefix}${remainder}` : remainder;
        if (prefix) {
            lastPrefix = prefix;
        }
        completedIds.push(fullId);
    }

    return completedIds;
}

function encodeSingleCode(cardIds: string[]): string {
    if (!cardIds || cardIds.length === 0) return "";

    const normalizedIds = normalizeAndCompleteCardIds(cardIds);
    const cardCounts = new Map<string, number>();
    for (const id of normalizedIds) {
        const trimmed = id.trim();
        if (!trimmed) continue;
        cardCounts.set(trimmed, (cardCounts.get(trimmed) || 0) + 1);
    }

    let decimalChunks = "";
    cardCounts.forEach((totalCount, cardId) => {
        let remainingCount = totalCount;
        while (remainingCount > 0) {
            const count = Math.min(remainingCount, 4);
            remainingCount -= count;

            let prefix = "";
            let type = "";
            let number = 0;

            let rest = cardId;
            const lowerId = cardId.toLowerCase();

            if (lowerId.startsWith("prm")) {
                prefix = "prm";
                rest = cardId.substring(3);
            } else if (lowerId.startsWith("ex")) {
                prefix = "ex";
                rest = cardId.substring(2);
            } else if (lowerId.startsWith("xp")) {
                prefix = "xp";
                rest = cardId.substring(2);
            } else if (lowerId.startsWith("yp")) {
                prefix = "yp";
                rest = cardId.substring(2);
            } else {
                const isNormalCard = /^[ASMD]-/.test(cardId);
                if (isNormalCard) {
                    prefix = "";
                    rest = cardId;
                } else {
                    const firstChar = cardId[0];
                    const expIdx = EXPANSION_CHARS.indexOf(firstChar);
                    if (expIdx !== -1 && expIdx % 10 !== 0) {
                        prefix = firstChar;
                        rest = cardId.substring(1);
                    }
                }
            }

            const dashIdx = rest.lastIndexOf('-');
            if (dashIdx !== -1) {
                type = rest.substring(0, dashIdx);
                number = parseInt(rest.substring(dashIdx + 1), 10) || 1;
            } else {
                type = "A";
                number = 1;
            }

            let expansionChar = prefix;
            if (prefix === "ex") expansionChar = "e";
            else if (prefix === "prm") expansionChar = "p";
            else if (prefix === "xp") expansionChar = "x";
            else if (prefix === "yp") expansionChar = "y";
            else if (prefix === "") expansionChar = "A";

            const expIndex = EXPANSION_CHARS.indexOf(expansionChar);
            const expansionBase = Math.max(0, expIndex % 10);
            const typePlus5 = expIndex >= 20;
            const countPlus5 = (expIndex >= 10 && expIndex < 20) || expIndex >= 30;

            const numStr = number.toString().padStart(2, '0');

            let typeCode = "1";
            if (type === "A") typeCode = typePlus5 ? "6" : "1";
            else if (type === "S") typeCode = typePlus5 ? "7" : "2";
            else if (type === "M") typeCode = typePlus5 ? "8" : "3";
            else if (type === "D") typeCode = typePlus5 ? "9" : "4";

            const finalD5 = countPlus5 ? (count + 5) : count;
            const chunk = `${expansionBase}${typeCode}${numStr}${finalD5}`;
            decimalChunks += chunk;
        }
    });

    const j5 = decimalChunks;
    const j4 = j5.length;

    const fullK6Chunks: string[] = [];
    for (let c = 1; c <= 100; c++) {
        const start = c * 3 - 2;
        if (start < j4 + 3) {
            const sub = j5.substring(start - 1, Math.min(j5.length, start - 1 + 3));
            if (sub.length > 0) {
                const part = parseInt(sub, 10);
                const signedValue = 500 - part;
                fullK6Chunks.push(convertToSigned10BitBinary(signedValue));
            } else {
                fullK6Chunks.push("");
            }
        } else {
            fullK6Chunks.push("");
        }
    }

    const validK6 = fullK6Chunks.filter(Boolean);
    const k4 = validK6.length * 10;
    const joinedK6 = validK6.join("");
    const modK4_6 = k4 % 6;
    const padZeros = padCountFromMod(modK4_6);
    const k5 = joinedK6 + "0".repeat(padZeros);

    const fullL6Values: number[] = [];
    for (let c = 1; c <= 172; c++) {
        if (c * 6 < k4 + 6) {
            const start = c * 6 - 5;
            const part1 = k5.substring(start - 1, start - 1 + 3);
            const part2 = k5.substring(start - 1 + 3, start - 1 + 3 + 3);
            const bin2oct1 = parseInt(part1 || "0", 2);
            const bin2oct2 = parseInt(part2 || "0", 2);
            fullL6Values.push(bin2oct1 * 8 + bin2oct2);
        } else {
            fullL6Values.push(NaN);
        }
    }

    let countMod8Is0 = 0;
    let countLessThan8 = 0;

    for (let i = 0; i < 100; i++) {
        const val = fullL6Values[i];
        if (!isNaN(val)) {
            if (val % 8 === 0) countMod8Is0++;
            if (val < 8) countLessThan8++;
        }
    }

    const firstTerm = (modK4_6 === 0) ? 56 : (modK4_6 + 1) * 8;
    const sumCounts = countMod8Is0 + countLessThan8;
    const modPart = ((sumCounts % 8) + 8) % 8;
    const l4 = firstTerm + 8 - modPart;

    const m4 = BASE64_CHARS[l4 - 1] || "";

    const fullM6Chars: string[] = [];
    for (let i = 0; i < fullL6Values.length; i++) {
        const val = fullL6Values[i];
        if (!isNaN(val)) {
            const charIdx = val + 1;
            fullM6Chars.push(BASE64_CHARS[charIdx - 1] || "");
        }
    }

    return `KCG-${m4}${fullM6Chars.join("")}`;
}

export function encodeKcgMulti(mainCards: string[], sideCards: string[]): string {
    const mainCode = encodeSingleCode(mainCards);
    const sideCode = sideCards.length > 0 ? encodeSingleCode(sideCards) : "";
    return sideCode ? `${mainCode}|${sideCode}` : mainCode;
}

export function encodeKcgMultiWithDebug(mainCards: string[], sideCards: string[]): { mainKcg: string; sideKcg: string; debug: string } {
    const mainKcg = encodeSingleCode(mainCards);
    const sideKcg = sideCards.length > 0 ? encodeSingleCode(sideCards) : "";
    return {
        mainKcg,
        sideKcg,
        debug: ""
    };
}

function decodeSingleCode(inputCode: string): string[] {
    if (!inputCode || !inputCode.trim()) return [];
    const cleanCode = inputCode.replace(/\s+/g, '');

    // 💡 修正: KCGコードである場合は、スラッシュが含まれていてもKCGとしてデコードする
    if (!cleanCode.startsWith("KCG-")) {
        if (cleanCode.includes('/')) {
            const rawIds = cleanCode.split('/').map(id => id.trim()).filter(Boolean);
            return normalizeAndCompleteCardIds(rawIds);
        }
        return normalizeAndCompleteCardIds([cleanCode.trim()]);
    }

    try {
        if (cleanCode.length < 6) return [];
        const headerChar = cleanCode[4];
        const headerIndex = BASE64_CHARS.indexOf(headerChar) + 1;
        if (headerIndex <= 0) return [];

        const quotient = Math.floor((headerIndex - 1) / 8) + 1;
        const bodyCode = cleanCode.substring(5);
        let binaryString = "";
        for (const c of bodyCode) {
            const val = BASE64_CHARS.indexOf(c);
            if (val === -1) return [];
            binaryString += val.toString(2).padStart(6, '0');
        }

        const trimLength = 8 - quotient;
        if (binaryString.length < trimLength) return [];
        const trimmedBinaryString = binaryString.substring(0, binaryString.length - trimLength);

        let decimalString = "";
        for (let i = 0; i < trimmedBinaryString.length; i += 10) {
            if (i + 10 > trimmedBinaryString.length) break;
            const chunk = trimmedBinaryString.substring(i, i + 10);
            const signedValue = convertFromSigned10BitBinary(chunk);
            const finalValue = 500 - signedValue;
            decimalString += finalValue.toString().padStart(3, '0');
        }

        const mod5 = decimalString.length % 5;
        if (mod5 === 1 && decimalString.length >= 3) {
            decimalString = decimalString.slice(0, decimalString.length - 3) + decimalString.slice(decimalString.length - 2);
        } else if (mod5 === 2 && decimalString.length >= 3) {
            decimalString = decimalString.slice(0, decimalString.length - 3) + decimalString.slice(decimalString.length - 1);
        }

        const cardIds: string[] = [];
        for (let i = 0; i < decimalString.length; i += 5) {
            if (i + 5 > decimalString.length) break;
            const chunk = decimalString.substring(i, i + 5);

            const d5 = parseInt(chunk[4], 10);
            const expansionBase = parseInt(chunk[0], 10);

            let count = d5;
            let countPlus5 = false;

            if (count >= 6 && count <= 9) {
                countPlus5 = true;
                count -= 5;
            } else if (count === 5) {
                countPlus5 = true;
                count = 0;
            }

            let type = "";
            let typePlus5 = false;
            switch (chunk[1]) {
                case '1': type = "A"; break;
                case '2': type = "S"; break;
                case '3': type = "M"; break;
                case '4': type = "D"; break;
                case '6': type = "A"; typePlus5 = true; break;
                case '7': type = "S"; typePlus5 = true; break;
                case '8': type = "M"; typePlus5 = true; break;
                case '9': type = "D"; typePlus5 = true; break;
                default: continue;
            }

            const expansionIndex = expansionBase + (typePlus5 ? 20 : 0) + (countPlus5 ? 10 : 0);
            if (expansionIndex >= EXPANSION_CHARS.length) continue;

            const expansionChar = EXPANSION_CHARS[expansionIndex];
            
            let expansion = "";
            if (expansionIndex === 0) expansion = "ex";
            else if (expansionIndex === 10) expansion = "prm";
            else if (expansionIndex === 20) expansion = "xp";
            else if (expansionIndex === 30) expansion = "yp";
            else expansion = expansionChar;

            let numberStr = chunk.substring(2, 4);
            if (numberStr.startsWith("0")) numberStr = numberStr.substring(1);
            
            const cardId = expansion ? `${expansion}${type}-${numberStr}` : `${type}-${numberStr}`;

            for (let j = 0; j < count; j++) {
                cardIds.push(cardId);
            }
        }
        return normalizeAndCompleteCardIds(cardIds);
    } catch {
        return [];
    }
}

// デバッグログ付きの単体コードデコード関数
export function decodeSingleCodeWithDebug(inputCode: string): { cardIds: string[]; debugLogs: string[] } {
    const logs: string[] = [];
    logs.push(`[Input] inputCode: "${inputCode}"`);
    
    if (!inputCode || !inputCode.trim()) {
        logs.push(`-> Error: Input code is empty.`);
        return { cardIds: [], debugLogs: logs };
    }
    const cleanCode = inputCode.replace(/\s+/g, '');
    logs.push(`[Cleaned] cleanCode: "${cleanCode}"`);

    // 💡 修正: 先に KCGコードであるかを判定する
    if (!cleanCode.startsWith("KCG-")) {
        if (cleanCode.includes('/')) {
            logs.push(`-> Detected '/' separator format.`);
            const rawIds = cleanCode.split('/').map(id => id.trim()).filter(Boolean);
            const ids = normalizeAndCompleteCardIds(rawIds);
            logs.push(`-> Result IDs (Normalized): ${JSON.stringify(ids)}`);
            return { cardIds: ids, debugLogs: logs };
        }
        logs.push(`-> Not starting with "KCG-", treating as single card.`);
        const ids = normalizeAndCompleteCardIds([cleanCode.trim()]);
        return { cardIds: ids, debugLogs: logs };
    }

    try {
        logs.push(`-> Detected KCG code format.`);
        if (cleanCode.length < 6) {
            logs.push(`-> Error: Code length < 6`);
            return { cardIds: [], debugLogs: logs };
        }
        const headerChar = cleanCode[4];
        const headerIndex = BASE64_CHARS.indexOf(headerChar) + 1;
        logs.push(`[Header] headerChar: "${headerChar}", headerIndex: ${headerIndex}`);
        if (headerIndex <= 0) {
            logs.push(`-> Error: Invalid header index`);
            return { cardIds: [], debugLogs: logs };
        }

        const quotient = Math.floor((headerIndex - 1) / 8) + 1;
        const bodyCode = cleanCode.substring(5);
        logs.push(`[Body] quotient: ${quotient}, bodyCode length: ${bodyCode.length}`);

        let binaryString = "";
        for (const c of bodyCode) {
            const val = BASE64_CHARS.indexOf(c);
            if (val === -1) {
                logs.push(`-> Error: Invalid BASE64 char "${c}" in body`);
                return { cardIds: [], debugLogs: logs };
            }
            binaryString += val.toString(2).padStart(6, '0');
        }
        logs.push(`[Binary] Raw binary length: ${binaryString.length}`);

        const trimLength = 8 - quotient;
        logs.push(`[Trim] trimLength (8 - quotient): ${trimLength}`);
        if (binaryString.length < trimLength) {
            logs.push(`-> Error: Binary length less than trimLength`);
            return { cardIds: [], debugLogs: logs };
        }
        const trimmedBinaryString = binaryString.substring(0, binaryString.length - trimLength);
        logs.push(`[TrimmedBinary] length: ${trimmedBinaryString.length}`);

        let decimalString = "";
        for (let i = 0; i < trimmedBinaryString.length; i += 10) {
            if (i + 10 > trimmedBinaryString.length) break;
            const chunk = trimmedBinaryString.substring(i, i + 10);
            const signedValue = convertFromSigned10BitBinary(chunk);
            const finalValue = 500 - signedValue;
            decimalString += finalValue.toString().padStart(3, '0');
        }
        logs.push(`[DecimalString] length: ${decimalString.length}, value: "${decimalString}"`);

        const mod5 = decimalString.length % 5;
        logs.push(`[Mod5] decimalString.length % 5 = ${mod5}`);
        if (mod5 === 1 && decimalString.length >= 3) {
            decimalString = decimalString.slice(0, decimalString.length - 3) + decimalString.slice(decimalString.length - 2);
            logs.push(`-> Adjusted mod5 === 1: "${decimalString}"`);
        } else if (mod5 === 2 && decimalString.length >= 3) {
            decimalString = decimalString.slice(0, decimalString.length - 3) + decimalString.slice(decimalString.length - 1);
            logs.push(`-> Adjusted mod5 === 2: "${decimalString}"`);
        }

        const cardIds: string[] = [];
        for (let i = 0; i < decimalString.length; i += 5) {
            if (i + 5 > decimalString.length) break;
            const chunk = decimalString.substring(i, i + 5);
            const d5 = parseInt(chunk[4], 10);
            const expansionBase = parseInt(chunk[0], 10);

            let count = d5;
            let countPlus5 = false;

            if (count >= 6 && count <= 9) {
                countPlus5 = true;
                count -= 5;
            } else if (count === 5) {
                countPlus5 = true;
                count = 0;
            }

            let type = "";
            let typePlus5 = false;
            switch (chunk[1]) {
                case '1': type = "A"; break;
                case '2': type = "S"; break;
                case '3': type = "M"; break;
                case '4': type = "D"; break;
                case '6': type = "A"; typePlus5 = true; break;
                case '7': type = "S"; typePlus5 = true; break;
                case '8': type = "M"; typePlus5 = true; break;
                case '9': type = "D"; typePlus5 = true; break;
                default: 
                    logs.push(`-> Skip chunk ${chunk}: unknown type char ${chunk[1]}`);
                    continue;
            }

            const expansionIndex = expansionBase + (typePlus5 ? 20 : 0) + (countPlus5 ? 10 : 0);
            if (expansionIndex >= EXPANSION_CHARS.length) {
                logs.push(`-> Skip chunk ${chunk}: expansionIndex ${expansionIndex} out of bounds`);
                continue;
            }

            const expansionChar = EXPANSION_CHARS[expansionIndex];
            
            let expansion = "";
            if (expansionIndex === 0) expansion = "ex";
            else if (expansionIndex === 10) expansion = "prm";
            else if (expansionIndex === 20) expansion = "xp";
            else if (expansionIndex === 30) expansion = "yp";
            else expansion = expansionChar;

            let numberStr = chunk.substring(2, 4);
            if (numberStr.startsWith("0")) numberStr = numberStr.substring(1);

            const cardId = expansion ? `${expansion}${type}-${numberStr}` : `${type}-${numberStr}`;
            logs.push(`-> Chunk "${chunk}" => Card: "${cardId}", count: ${count}`);

            for (let j = 0; j < count; j++) {
                cardIds.push(cardId);
            }
        }
        const normalizedIds = normalizeAndCompleteCardIds(cardIds);
        logs.push(`[Success] Normalized decoded card IDs count: ${normalizedIds.length}`);
        return { cardIds: normalizedIds, debugLogs: logs };
    } catch (e: any) {
        logs.push(`-> Exception during decode: ${e.message || e}`);
        return { cardIds: [], debugLogs: logs };
    }
}

export function parseKcgMulti(kcgInput: string): { main: string[]; side: string[] } {
    if (!kcgInput) return { main: [], side: [] };
    const parts = kcgInput.split('|');
    const main = parts[0] ? decodeSingleCode(parts[0]) : [];
    const side = parts[1] ? decodeSingleCode(parts[1]) : [];
    return { main, side };
}

export function parseKcgMultiWithDebug(kcgInput: string): { main: string[]; side: string[]; debugLogs: string[] } {
    if (!kcgInput) return { main: [], side: [], debugLogs: ["Input is empty"] };
    const parts = kcgInput.split('|');
    const mainRes = parts[0] ? decodeSingleCodeWithDebug(parts[0]) : { cardIds: [], debugLogs: [] };
    const sideRes = parts[1] ? decodeSingleCodeWithDebug(parts[1]) : { cardIds: [], debugLogs: [] };
    
    const combinedLogs = [
        `=== MAIN DECODE LOGS ===`,
        ...mainRes.debugLogs,
        `=== SIDE DECODE LOGS ===`,
        ...sideRes.debugLogs
    ];
    return { main: mainRes.cardIds, side: sideRes.cardIds, debugLogs: combinedLogs };
}

export function formatDeckData(mainCards: string[], sideCards: string[]): string {
    const mainStr = mainCards.join('/');
    const sideStr = sideCards.length > 0 ? sideCards.join('/') : "";
    return sideStr ? `${mainStr}/*side*/${sideStr}` : mainStr;
}

export function parseDeckData(dataString: string): { main: string[]; side: string[] } {
    if (!dataString) return { main: [], side: [] };
    if (!dataString.includes('*side*')) {
        const rawIds = dataString.split('/').map(s => s.trim()).filter(Boolean);
        return { main: normalizeAndCompleteCardIds(rawIds), side: [] };
    }
    const parts = dataString.split('*side*');
    const mainRaw = parts[0] ? parts[0].split('/').map(s => s.trim()).filter(Boolean) : [];
    const sideRaw = parts[1] ? parts[1].split('/').map(s => s.trim()).filter(Boolean) : [];
    return { 
        main: normalizeAndCompleteCardIds(mainRaw), 
        side: normalizeAndCompleteCardIds(sideRaw) 
    };
}