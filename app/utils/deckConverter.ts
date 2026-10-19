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

function encodeSingleCode(cardIds: string[]): string {
    if (!cardIds || cardIds.length === 0) return "";

    const cardCounts = new Map<string, number>();
    for (const id of cardIds) {
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
                const firstChar = cardId[0];
                const expIdx = EXPANSION_CHARS.indexOf(firstChar);
                if (expIdx !== -1 && expIdx % 10 !== 0) {
                    prefix = firstChar;
                    rest = cardId.substring(1);
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

    if (cleanCode.includes('/')) {
        return cleanCode.split('/').map(id => id.trim()).filter(Boolean);
    }

    if (!cleanCode.startsWith("KCG-")) {
        return [cleanCode.trim()];
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
            
            // 💡 拡張プレフィックスのデコード復元を完全保証
            let expansion = "";
            if (expansionIndex === 0) expansion = "ex";
            else if (expansionIndex === 10) expansion = "prm";
            else if (expansionIndex === 20) expansion = "xp";
            else if (expansionIndex === 30) expansion = "yp";
            else if (expansionIndex >= 1 && expansionIndex <= 9) expansion = ""; // 通常弾（プレフィックスなし、例: A-1）
            else expansion = expansionChar; // 特殊1文字プレフィックス（J〜R, S〜ア, イ〜コ等）

            let numberStr = chunk.substring(2, 4);
            if (numberStr.startsWith("0")) numberStr = numberStr.substring(1);
            
            const cardId = expansion ? `${expansion}${type}-${numberStr}` : `${type}-${numberStr}`;

            for (let j = 0; j < count; j++) {
                cardIds.push(cardId);
            }
        }
        return cardIds;
    } catch {
        return [];
    }
}

export function parseKcgMulti(kcgInput: string): { main: string[]; side: string[] } {
    if (!kcgInput) return { main: [], side: [] };
    const parts = kcgInput.split('|');
    const main = parts[0] ? decodeSingleCode(parts[0]) : [];
    const side = parts[1] ? decodeSingleCode(parts[1]) : [];
    return { main, side };
}

export function formatDeckData(mainCards: string[], sideCards: string[]): string {
    const mainStr = mainCards.join('/');
    const sideStr = sideCards.length > 0 ? sideCards.join('/') : "";
    return sideStr ? `${mainStr}/*side*/${sideStr}` : mainStr;
}

export function parseDeckData(dataString: string): { main: string[]; side: string[] } {
    if (!dataString) return { main: [], side: [] };
    if (!dataString.includes('*side*')) {
        return { main: dataString.split('/').map(s => s.trim()).filter(Boolean), side: [] };
    }
    const parts = dataString.split('*side*');
    const main = parts[0] ? parts[0].split('/').map(s => s.trim()).filter(Boolean) : [];
    const side = parts[1] ? parts[1].split('/').map(s => s.trim()).filter(Boolean) : [];
    return { main, side };
}