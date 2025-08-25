// utils/deckCodeParser.js
import { CHAR_MAP, MAP1_EXPANSION, MAP2_EXPANSION } from "../constants.js";

export function readKCGCode(deckCode) {
  try {
    // --- 1. 入力チェックと初期処理 ---
    if (!deckCode || !deckCode.startsWith("KCG-")) {
      console.error("Invalid deck code format: Must start with 'KCG-'.");
      return []; // エラー時は空配列を返す
    }
    const rawPayloadWithVersion = deckCode.substring(4);
    if (rawPayloadWithVersion.length === 0) {
      console.error("Invalid deck code: Payload is empty.");
      return []; // エラー時は空配列を返す
    }
    for (const char of rawPayloadWithVersion) {
      if (CHAR_MAP.indexOf(char) === -1) {
        console.error(`Invalid character in deck code: ${char}`);
        return []; // エラー時は空配列を返す
      }
    }
    // --- 2. パディングビット数の計算 ---
    const fifthCharOriginal = rawPayloadWithVersion[0];
    const indexFifthChar = CHAR_MAP.indexOf(fifthCharOriginal) + 1;
    let deckCodeFifthCharQuotient = Math.floor(indexFifthChar / 8);
    const remainderFifthChar = indexFifthChar % 8;
    let charsToRemoveFromPayloadEnd;
    if (remainderFifthChar === 0) {
      charsToRemoveFromPayloadEnd = 0;
    } else {
      deckCodeFifthCharQuotient++;
      charsToRemoveFromPayloadEnd = 8 - deckCodeFifthCharQuotient;
    }
    // --- 3. ペイロードを6ビットのバイナリ文字列に変換 ---
    let initialBinaryPayload = "";
    const payload = rawPayloadWithVersion.substring(1);
    for (let i = 0; i < payload.length; i++) {
      const char = payload[i];
      const charIndex = CHAR_MAP.indexOf(char);
      initialBinaryPayload += charIndex.toString(2).padStart(6, "0");
    }
    // --- 4. パディングを削除 ---
    let processedBinaryPayload = initialBinaryPayload;
    if (
      charsToRemoveFromPayloadEnd > 0 &&
      initialBinaryPayload.length >= charsToRemoveFromPayloadEnd
    ) {
      processedBinaryPayload = initialBinaryPayload.substring(
        0,
        initialBinaryPayload.length - charsToRemoveFromPayloadEnd
      );
    } else if (charsToRemoveFromPayloadEnd > 0) {
      processedBinaryPayload = "";
    }
    // --- 5. バイナリを数値文字列に変換 ---
    let intermediateString = "";
    for (let i = 0; i + 10 <= processedBinaryPayload.length; i += 10) {
      const tenBitChunk = processedBinaryPayload.substring(i, i + 10);

      let signedDecimalVal;
      if (tenBitChunk[0] === "1") {
        const unsignedVal = parseInt(tenBitChunk, 2);
        signedDecimalVal = unsignedVal - 1024; // 1024 = 2^10
      } else {
        signedDecimalVal = parseInt(tenBitChunk, 2);
      }

      const nVal = 500 - signedDecimalVal;

      let formattedNVal;
      if (nVal >= 0 && nVal < 10) {
        formattedNVal = "XX" + nVal.toString();
      } else if (nVal >= 10 && nVal < 100) {
        formattedNVal = "X" + nVal.toString();
      } else {
        formattedNVal = nVal.toString();
      }
      intermediateString += formattedNVal;
    }
    // --- 6. 数値文字列を5の倍数に調整し、'X'を'0'に置換 ---
    const remainderForFive = intermediateString.length % 5;
    let adjustedString = intermediateString;
    if (remainderForFive !== 0) {
      let charsToActuallyRemove = remainderForFive;
      let stringAsArray = intermediateString.split("");
      let removedXCount = 0;
      for (
        let i = stringAsArray.length - 1;
        i >= 0 && removedXCount < charsToActuallyRemove;
        i--
      ) {
        if (stringAsArray[i] === "X") {
          stringAsArray.splice(i, 1);
          removedXCount++;
        }
      }
      const remainingCharsToRemove = charsToActuallyRemove - removedXCount;
      if (remainingCharsToRemove > 0) {
        stringAsArray.splice(
          stringAsArray.length - remainingCharsToRemove,
          remainingCharsToRemove
        );
      }
      adjustedString = stringAsArray.join("");
    }
    const finalNumericString = adjustedString.replace(/X/g, "0");
    // --- 7. 数値文字列をカード情報にデコード ---
    const decodedEntries = [];
    if (finalNumericString.length % 5 !== 0) {
      console.error("Final numeric string length is not a multiple of 5.");
      return []; // エラー時は空配列を返す
    }
    for (let i = 0; i < finalNumericString.length; i += 5) {
      const fiveDigitChunk = finalNumericString.substring(i, i + 5);
      const c1 = parseInt(fiveDigitChunk[0], 10);
      const c2 = parseInt(fiveDigitChunk[1], 10);
      const c3 = parseInt(fiveDigitChunk[2], 10);
      const c4 = parseInt(fiveDigitChunk[3], 10);
      const c5 = parseInt(fiveDigitChunk[4], 10);
      let expansionMap;
      if (c5 >= 1 && c5 <= 4) {
        expansionMap = MAP1_EXPANSION;
      } else if (c5 >= 6 && c5 <= 9) {
        expansionMap = MAP2_EXPANSION;
      } else {
        continue;
      }
      if (c1 >= expansionMap.length) {
        continue;
      }
      const selectedCharFromMap = expansionMap[c1];
      let expansion;
      if (selectedCharFromMap === "e") {
        expansion = "ex";
      } else if (selectedCharFromMap === "p") {
        expansion = "prm";
      } else {
        expansion = selectedCharFromMap;
      }
      let type;
      switch (c2) {
        case 1:
          type = "A";
          break;
        case 2:
          type = "S";
          break;
        case 3:
          type = "M";
          break;
        case 4:
          type = "D";
          break;
        default:
          continue;
      }
      const numberPartInt = c3 * 10 + c4;
      if (numberPartInt < 1 || numberPartInt > 50) {
        continue;
      }
      const cardIdPart = `${expansion}${type}-${numberPartInt}`;
      decodedEntries.push({ cardIdPart, originalC5Value: c5 });
    }
    // --- 8. 最終的なデッキデータ文字列を生成 ---
    const deckListOutput = [];
    for (const entry of decodedEntries) {
      const repeatCount = entry.originalC5Value % 5;
      for (let r = 0; r < repeatCount; r++) {
        deckListOutput.push(entry.cardIdPart);
      }
    }
    console.log("KCGデッキコードのデコード完了:", deckListOutput);
    return deckListOutput;
  } catch (error) {
    console.error("KCGデッキコードのデコード中にエラーが発生:", error);
    return []; // エラー時は空配列を返す
  }
}
