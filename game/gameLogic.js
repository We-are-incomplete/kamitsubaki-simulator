// game/gameLogic.js
import { gameState } from './gameState.js';

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function mulliganHand() {
    if (gameState.zones.hand.length === 0) return;
    gameState.zones.deck = shuffle(gameState.zones.deck.concat(gameState.zones.hand));
    gameState.zones.hand = [];
    for (let i = 0; i < 7; i++) {
        if (gameState.zones.deck.length > 0) {
            gameState.zones.hand.push(gameState.zones.deck.pop());
        }
    }
}

export function moveHandToTrash() {
    gameState.zones.trash = gameState.zones.trash.concat(gameState.zones.hand);
    gameState.zones.hand = [];
}

export function sortHand() {
    if (!gameState.initialDeckOrder || gameState.initialDeckOrder.length === 0) {
        console.warn("Initial deck order is not available for sorting.");
        return;
    }
    gameState.zones.hand.sort((cardIdA, cardIdB) => {
        const indexA = gameState.initialDeckOrder.indexOf(cardIdA);
        const indexB = gameState.initialDeckOrder.indexOf(cardIdB);

        // initialDeckOrder に見つからないカードは末尾に（実際にはこのシミュレーターでは発生しづらい）
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });
}

export function swapStageColumns(index1, index2) {
    if (index1 === index2) return; // 同じ列なら何もしない

    // gameState.zones.stage の内容をディープコピーして入れ替え
    const tempColumnData = JSON.parse(JSON.stringify(gameState.zones.stage[index1]));
    gameState.zones.stage[index1] = JSON.parse(JSON.stringify(gameState.zones.stage[index2]));
    gameState.zones.stage[index2] = tempColumnData;
}

export function removeCardFromState(cardData, fromInfo) {
    if (!cardData || !fromInfo) {
        console.warn('[removeCardFromState] Invalid parameters:', { cardData, fromInfo });
        return;
    }
    const zoneId = fromInfo.zoneId; // 'trash-expanded'からドラッグした場合、ここは'trash'になる
    const cardIdToRemove = cardData.cardId;
    let slotArray;

    if (zoneId === 'direction') {
        slotArray = gameState.zones.direction[fromInfo.slotIndex];
    } else if (zoneId === 'stage') {
        slotArray = gameState.zones.stage[fromInfo.slotIndex][fromInfo.slotColor];
    }

    if (slotArray && slotArray.length > 0) {
        const topCardObject = slotArray[slotArray.length - 1];
        if (topCardObject.cardId === cardIdToRemove) {
            slotArray.pop();
        } else {
            console.warn(`[removeCardFromState] Card mismatch in ${zoneId}. Expected: ${cardIdToRemove}, Found: ${topCardObject.cardId}`);
        }
    } else if (zoneId !== 'direction' && zoneId !== 'stage') {
        const zone = gameState.zones[zoneId];
        if (!zone) {
            console.warn(`[removeCardFromState] Zone ${zoneId} not found`);
            return;
        }

        if (zoneId === 'deck' || zoneId === 'volNoise') {
            if (zone.length > 0 && zone[zone.length - 1] === cardIdToRemove) {
                zone.pop();
            } else {
                console.warn(`[removeCardFromState] ${zoneId} top card mismatch or zone empty. Card to remove: ${cardIdToRemove}. Actual top: ${zone.length > 0 ? zone[zone.length-1] : 'N/A'}. Falling back to indexOf search.`);
                const index = zone.indexOf(cardIdToRemove);
                if (index > -1) {
                    zone.splice(index, 1);
                } else {
                    console.error(`[removeCardFromState] Failed to find card ${cardIdToRemove} in ${zoneId}`);
                }
            }
        } else {
            const index = zone.indexOf(cardIdToRemove);
            if (index > -1) {
                zone.splice(index, 1);
            } else {
                console.warn(`[removeCardFromState] Card ${cardIdToRemove} not found in ${zoneId}`);
            }
        }
    }
}

export function addCardToState(cardData, toInfo) {
    if (!cardData || !toInfo || !toInfo.zoneId) {
        console.warn('[addCardToState] Invalid parameters:', { cardData, toInfo });
        return false;
    }
    const zoneId = toInfo.zoneId;
    const cardObject = { cardId: cardData.cardId, isStandby: false };

    if (zoneId === 'direction') {
        if (toInfo.slotIndex !== undefined) {
            // ディレクションスロットに既にカードがある場合は追加しない
            if (gameState.zones.direction[toInfo.slotIndex].length > 0) {
                return false; 
            }
            gameState.zones.direction[toInfo.slotIndex].push(cardObject);
            return true;
        }
        return false; // slotIndex が undefined の場合
    } else if (zoneId === 'stage') {
        if (toInfo.slotIndex !== undefined && toInfo.slotColor) {
            if (toInfo.slotColor === 'blue') {
                // 青スロットに既にカードがある場合は追加しない
                if (gameState.zones.stage[toInfo.slotIndex][toInfo.slotColor].length > 0) {
                    return false;
                }
                cardObject.isStandby = true;
            }
            // 他の色（green, red）のスロットや、空の青スロットへの追加
            gameState.zones.stage[toInfo.slotIndex][toInfo.slotColor].push(cardObject);
            return true;
        }
        return false; // slotIndex または slotColor が undefined の場合
    } else {
        const zone = gameState.zones[zoneId];
        if (zone && typeof cardObject.cardId === 'string') {
            zone.push(cardObject.cardId);
            if (zoneId === 'volNoise') {
                shuffle(gameState.zones.volNoise); // VOLノイズ置き場に追加されたらシャッフル
            }
            return true;
        }
        console.warn(`[addCardToState] Failed to add card ${cardData.cardId} to ${zoneId}:`, { zone: !!zone, cardIdType: typeof cardObject.cardId });
        return false; // zone が無効、または cardId が文字列でない場合
    }
}
