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

/**
 * 単一のKCGコードまたはスラッシュ区切り文字列をデコードする
 */
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
            const expansion = (expansionChar === 'e') ? "ex" : (expansionChar === 'p') ? "prm" : (expansionChar === 'x') ? "xp" : (expansionChar === 'y') ? "yp" : expansionChar;

            let numberStr = chunk.substring(2, 4);
            if (numberStr.startsWith("0")) numberStr = numberStr.substring(1);
            const cardId = `${expansion}${type}-${numberStr}`;

            for (let j = 0; j < count; j++) {
                cardIds.push(cardId);
            }
        }
        return cardIds;
    } catch {
        return [];
    }
}

/**
 * 単一のカードIDリストをエンコードして KCG- 形式にする
 */
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
            if (cardId.startsWith("ex")) { prefix = "ex"; rest = cardId.substring(2); }
            else if (cardId.startsWith("prm")) { prefix = "prm"; rest = cardId.substring(3); }
            else if (cardId.startsWith("xp")) { prefix = "xp"; rest = cardId.substring(2); }
            else if (cardId.startsWith("yp")) { prefix = "yp"; rest = cardId.substring(2); }
            else {
                const firstChar = cardId[0];
                if (/[A-I]/.test(firstChar)) {
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

            let typePlus5 = false;
            let countPlus5 = false;

            let expansionChar = prefix;
            if (prefix === "ex") expansionChar = "e";
            else if (prefix === "prm") expansionChar = "p";
            else if (prefix === "xp") expansionChar = "x";
            else if (prefix === "yp") expansionChar = "y";
            else if (prefix === "") expansionChar = "A";

            const expIndex = EXPANSION_CHARS.indexOf(expansionChar);
            const expansionBase = Math.max(0, expIndex % 10);
            if (expIndex >= 20) typePlus5 = true;
            if (expIndex >= 10 && expIndex < 20) countPlus5 = true;
            if (expIndex >= 30) countPlus5 = true;

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

    let decimalString = decimalChunks;
    const currentLen = decimalString.length;
    const targetRem = currentLen % 3;
    if (targetRem === 1) decimalString += "00";
    else if (targetRem === 2) decimalString += "0";

    let binaryBuilder = "";
    for (let i = 0; i < decimalString.length; i += 3) {
        if (i + 3 > decimalString.length) break;
        const part = parseInt(decimalString.substring(i, i + 3), 10);
        const signedValue = 500 - part;
        binaryBuilder += convertToSigned10BitBinary(signedValue);
    }

    const quotient = 1;
    const trimLength = 8 - quotient;
    binaryBuilder += "0".repeat(trimLength);

    let bodyCode = "";
    for (let i = 0; i < binaryBuilder.length; i += 6) {
        const chunk6 = binaryBuilder.substring(i, i + 6).padEnd(6, '0');
        const val = parseInt(chunk6, 2);
        bodyCode += BASE64_CHARS[val % BASE64_CHARS.length];
    }

    const remainder = 0;
    const headerIndex = (quotient - 1) * 8 + remainder;
    const headerChar = BASE64_CHARS[headerIndex % BASE64_CHARS.length];

    return `KCG-1${headerChar}${bodyCode}`;
}

/**
 * メインとサイドに分かれたKCGコード（例: KCG-...|KCG-...）を生成する
 */
export function encodeKcgMulti(mainCards: string[], sideCards: string[]): string {
    const mainKcg = encodeSingleCode(mainCards);
    const sideKcg = sideCards.length > 0 ? encodeSingleCode(sideCards) : "";
    return sideKcg ? `${mainKcg}|${sideKcg}` : mainKcg;
}

/**
 * 「*side*」を含むデッキデータ文字列をフォーマットする
 */
export function formatDeckData(mainCards: string[], sideCards: string[]): string {
    const mainStr = mainCards.join('/');
    const sideStr = sideCards.length > 0 ? sideCards.join('/') : "";
    return sideStr ? `${mainStr}/*side*/${sideStr}` : mainStr;
}

/**
 * デッキデータ文字列（*side* 区切り）をメインとサイドのリストに分解する
 */
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

/**
 * 複数KCGコード（| 区切り）をメインとサイドのリストに分解する
 */
export function parseKcgMulti(kcgInput: string): { main: string[]; side: string[] } {
    if (!kcgInput) return { main: [], side: [] };
    const parts = kcgInput.split('|');
    const main = parts[0] ? decodeSingleCode(parts[0]) : [];
    const side = parts[1] ? decodeSingleCode(parts[1]) : [];
    return { main, side };
}