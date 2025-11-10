// KAMITSUBAKI CARD GAME 一人回し用シミュレーター - メインスクリプト

document.addEventListener('DOMContentLoaded', () => {
    const CHAR_MAP =
        "AIQYgow5BJRZhpx6CKSaiqy7DLTbjrz8EMUcks19FNVdlt2!GOWemu3?HPXfnv4/";
    const MAP1_EXPANSION = "eABCDEFGHI";
    const MAP2_EXPANSION = "pJKLMNOPQR";

    function readKCGCode(deckCode) {
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
                    initialBinaryPayload.length - charsToRemoveFromPayloadEnd,
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
                        remainingCharsToRemove,
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

    const counters = {
        vol: document.getElementById('vol-value'),
        manaAlpha: document.getElementById('mana-alpha-value'),
        manaBeta: document.getElementById('mana-beta-value'),
        manaOmega: document.getElementById('mana-omega-value'),
        turn: document.getElementById('turn-value'),
    };
    let gameState = {};
    const CARD_IMAGE_PATH = './cards/';
    window.DOUBLE_TAP_THRESHOLD = 300;
    const DOUBLE_TAP_THRESHOLD = window.DOUBLE_TAP_THRESHOLD || 300;
    const LONG_PRESS_DELAY = 500;
    let lastTapTime = 0;
    let lastTapTargetCardId = null;
    let longPressTimer = null; // 長押しタイマーのIDを保持
    let selectedChangeColumns = []; // 選択されたステージ列のインデックスを保持

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function displayShuffleMessage() {
        const shuffleMessageEl = document.getElementById('shuffle-message');
        if (shuffleMessageEl) {
            shuffleMessageEl.style.display = 'block';
            setTimeout(() => {
                shuffleMessageEl.style.display = 'none';
            }, 500); // 0.5秒後に非表示
        }
    }

    function displayTurnEndMessage() {
        const turnEndMessageEl = document.getElementById('turn-end-message');
        if (turnEndMessageEl) {
            turnEndMessageEl.style.display = 'block';
            setTimeout(() => {
                turnEndMessageEl.style.display = 'none';
            }, 1000); // 1秒後に非表示
        }
    }
    
    function initGameState(deckList = [], isDualMode = false, deckList2 = []) {
        const NUM_SLOTS = 5;
        gameState = {
            isDualMode: isDualMode,
            currentPlayer: 1, // 1 or 2
            players: {
                1: {
                    counters: { turn: 1, vol: 0, manaAlpha: 0, manaBeta: 0, manaOmega: 0 },
                    zones: {
                        deck: shuffle([...deckList]),
                        hand: [],
                        stage: Array(NUM_SLOTS).fill(null).map(() => ({ red: [], blue: [], green: [] })),
                        direction: Array(NUM_SLOTS).fill(null).map(() => []),
                        trash: [],
                        volNoise: [],
                        temporary: [],
                    },
                    initialDeckOrder: [...deckList]
                },
                2: isDualMode ? {
                    counters: { turn: 1, vol: 0, manaAlpha: 0, manaBeta: 0, manaOmega: 0 },
                    zones: {
                        deck: shuffle([...deckList2]),
                        hand: [],
                        stage: Array(NUM_SLOTS).fill(null).map(() => ({ red: [], blue: [], green: [] })),
                        direction: Array(NUM_SLOTS).fill(null).map(() => []),
                        trash: [],
                        volNoise: [],
                        temporary: [],
                    },
                    initialDeckOrder: [...deckList2]
                } : null
            }
        };
        // 現在のプレイヤーのデータを直接アクセス用に設定
        gameState.counters = gameState.players[gameState.currentPlayer].counters;
        gameState.zones = gameState.players[gameState.currentPlayer].zones;
        gameState.initialDeckOrder = gameState.players[gameState.currentPlayer].initialDeckOrder;
        // 初期手札を引く
        for (let i = 0; i < 7; i++) {
            if (gameState.zones.deck.length > 0) {
                gameState.zones.hand.push(gameState.zones.deck.pop());
            }
        }
        if (isDualMode && gameState.players[2]) {
            // プレイヤー2の初期手札
            for (let i = 0; i < 7; i++) {
                if (gameState.players[2].zones.deck.length > 0) {
                    gameState.players[2].zones.hand.push(gameState.players[2].zones.deck.pop());
                }
            }
        }
    }

    function renderAll() {
        document.querySelectorAll('.card, .zone-count').forEach(el => el.remove());
        ['deck', 'trash', 'volNoise'].forEach(zoneId => {
            const zoneEl = document.getElementById(`${zoneId}-zone`);
            if (!zoneEl) {
                console.error(`[RenderAll] Zone element with ID '${zoneId}-zone' not found.`);
                return;
            }
            zoneEl.innerHTML = '';
            const zoneData = gameState.zones[zoneId];
            if (zoneData) { 
                if (zoneData.length > 0) {
                    const topCardDisplayId = zoneData.slice(-1)[0];
                    zoneEl.appendChild(createCardElement(topCardDisplayId, false, zoneId, 'none'));
                } 
                const countEl = document.createElement('span');
                countEl.className = 'zone-count';
                countEl.textContent = zoneData.length;
                zoneEl.appendChild(countEl);
            } else {
                console.warn(`[RenderAll] gameState.zones.${zoneId} is undefined.`);
            }
        });
        const handZone = document.getElementById('hand-zone');
        handZone.querySelectorAll('.card').forEach(cardEl => cardEl.remove());
        gameState.zones.hand.forEach(cardId => {
            handZone.appendChild(createCardElement(cardId, false, 'hand', 'drag'));
        });
        gameState.zones.direction.forEach((cardArray, index) => {
            const slotEl = document.querySelector(`.card-slot[data-zone-id="direction"][data-slot-index="${index}"]`);
            if (slotEl && cardArray.length > 0) {
                cardArray.forEach((card, i) => {
                    const cardElement = createCardElement(card.cardId, card.isStandby, 'direction', 'drag', index);
                    let transformString = `translate(${i * 2}px, ${i * 2}px)`;
                    if (card.isStandby) transformString += ' rotate(90deg)';
                    cardElement.style.transform = transformString;
                    cardElement.style.zIndex = i;
                    slotEl.appendChild(cardElement);
                });
            }
        });
        gameState.zones.stage.forEach((column, index) => {
            ['green', 'blue', 'red'].forEach(color => {
                const cardArray = column[color];
                const slotEl = document.querySelector(`.card-slot[data-zone-id="stage"][data-slot-index="${index}"][data-slot-color="${color}"]`);
                if (slotEl && cardArray.length > 0) {
                    cardArray.forEach((card, i) => {
                        const cardElement = createCardElement(card.cardId, card.isStandby, 'stage', 'drag', index, color);
                        let transformString = '';
                        if (color === 'green') {
                            const yOffset = (i - (cardArray.length - 1)) * 30;
                            transformString = `translate(0px, ${yOffset}px)`;
                        } else if (color === 'red') {
                            const yOffset = i * 40;
                            transformString = `translate(0px, ${yOffset}px)`;
                        } else {
                            transformString = `translate(${i * 2}px, ${i * 2}px)`;
                        }
                        if (card.isStandby) transformString += ' rotate(90deg)';
                        cardElement.style.transform = transformString;
                        cardElement.style.zIndex = i;
                        slotEl.appendChild(cardElement);
                    });
                }
            });
        });
        for (const counterId in counters) {
            counters[counterId].textContent = gameState.counters[counterId];
        }
        const trashExpandedZoneEl = document.getElementById('trash-expanded-zone');
        trashExpandedZoneEl.innerHTML = '';
        if (trashExpandedZoneEl.style.display === 'flex') { 
            gameState.zones.trash.forEach(cardId => {
                const cardElement = createCardElement(cardId, false, 'trash-expanded', 'drag'); 
                trashExpandedZoneEl.appendChild(cardElement);
            });
        }
        const deckExpandedZoneEl = document.getElementById('deck-expanded-zone');
        deckExpandedZoneEl.innerHTML = '';
        if (deckExpandedZoneEl.style.display === 'flex') {
            for (let i = gameState.zones.deck.length - 1; i >= 0; i--) {
                const cardId = gameState.zones.deck[i];
                // 山札展開ゾーンのカードもドラッグ可能にする
                const cardElement = createCardElement(cardId, false, 'deck-expanded', 'drag');
                deckExpandedZoneEl.appendChild(cardElement);
            }
        }
        const volNoiseExpandedZoneEl = document.getElementById('volnoise-expanded-zone');
        volNoiseExpandedZoneEl.innerHTML = '';
        if (volNoiseExpandedZoneEl.style.display === 'flex') {
            gameState.zones.volNoise.forEach(cardId => {
                const cardElement = createCardElement(cardId, false, 'volnoise-expanded', 'drag');
                volNoiseExpandedZoneEl.appendChild(cardElement);
            });
        }
        const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
        const temporaryCardAreaEl = temporaryExpandedZoneEl.querySelector('.temporary-zone-card-area');
        temporaryCardAreaEl.innerHTML = '';
        if (temporaryExpandedZoneEl.style.display === 'flex') {
            gameState.zones.temporary.forEach(cardId => {
                const cardElement = createCardElement(cardId, false, 'temporary-expanded', 'drag');
                temporaryCardAreaEl.appendChild(cardElement);
            });
        }
        updateTemporaryButtonState();
    }

    function createCardElement(cardId, isStandby, zoneId, interactiveType, slotIndex, slotColor) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        // cardIdがオブジェクトの場合（stageやdirectionから）と文字列の場合（handやdeckから）を考慮
        const actualCardId = (typeof cardId === 'object' && cardId !== null) ? cardId.cardId : cardId;
        cardEl.dataset.cardId = actualCardId;

        if ((zoneId === 'deck' || zoneId === 'volNoise') && interactiveType === 'none') { // 山札またはVOLノイズのパイル表示のみ裏面
             cardEl.style.backgroundImage = `url('items/back.webp')`;
        } else if (actualCardId && typeof actualCardId === 'string' && actualCardId.trim() !== '') { // actualCardId が null でなく、空でない有効な文字列の場合のみ表面画像を設定
             cardEl.style.backgroundImage = `url('${CARD_IMAGE_PATH}${actualCardId}.webp')`;
        } else {           
             cardEl.style.backgroundImage = `url('items/back.webp')`;
        }

        if (isStandby) cardEl.style.transform = 'rotate(90deg)';
        
        if (interactiveType === 'drag') {
            cardEl.addEventListener('mousedown', e => handlePressStart(e, cardEl, zoneId, slotIndex, slotColor));
            cardEl.addEventListener('touchstart', e => handlePressStart(e, cardEl, zoneId, slotIndex, slotColor), { passive: false });
        }
        
        // タップイベントは手札、ステージ、ディレクションのカードにのみ設定
        if (zoneId === 'hand' || zoneId === 'stage' || zoneId === 'direction') {
             cardEl.addEventListener('click', e => handleTap(cardEl, { zoneId, slotIndex, slotColor, cardId: actualCardId }));
        }
        return cardEl;
    }

    function handlePressStart(e, element, zoneId, slotIndex, slotColor) {
        e.preventDefault();
        let isDragging = false;
        let draggedCardVisual = null;
        let draggedCardData = null;        let sourceInfo = { zoneId, slotIndex, slotColor };
        let isPile = (element.classList.contains('pile-zone')); // pile-zoneクラスで判定

        if (isPile) {
            zoneId = element.dataset.zoneId; // pile-zoneからzoneIdを取得
            sourceInfo.zoneId = zoneId; // sourceInfoも更新
            if (gameState.zones[zoneId].length === 0) return;
            // パイルからドラッグする場合は一番上のカード
            const topCardId = gameState.zones[zoneId][gameState.zones[zoneId].length - 1];
            draggedCardData = { cardId: (typeof topCardId === 'object' ? topCardId.cardId : topCardId), isStandby: false };
        } else if (zoneId === 'hand') {
            draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
        } else if (zoneId === 'direction') {
            const arr = gameState.zones.direction[slotIndex];
            if (!arr || arr.length === 0) return;
            draggedCardData = { ...arr[arr.length - 1] };
        } else if (zoneId === 'stage') {
            const arr = gameState.zones.stage[slotIndex][slotColor];
            if (!arr || arr.length === 0) return;
            draggedCardData = { ...arr[arr.length - 1] };
        } else if (zoneId === 'trash' || zoneId === 'trash-expanded') {
            draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
            sourceInfo.zoneId = 'trash'; // gameStateでの削除元は'trash'として扱う
        } else if (zoneId === 'deck-expanded') { // 山札展開ゾーンからのドラッグ
            draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
            sourceInfo.zoneId = 'deck'; // gameStateでの削除元は'deck'として扱う
        } else if (zoneId === 'volnoise-expanded') { // VOLノイズ展開ゾーンからのドラッグ
            draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
            sourceInfo.zoneId = 'volNoise'; // gameStateでの削除元は'volNoise'として扱う
        } else if (zoneId === 'temporary-expanded') { // テンポラリー展開ゾーンからのドラッグ
            draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
            sourceInfo.zoneId = 'temporary'; 
        }
        if (!draggedCardData && !isPile) { // パイルでない場合、カードデータがなければ終了
             return;
        }
        // パイルの場合、draggedCardDataは上で設定されているか、空ならreturn済み

        const touch = e.touches ? e.touches[0] : e;
        const rect = element.getBoundingClientRect();
        let offsetX = touch.clientX - rect.left;
        let offsetY = touch.clientY - rect.top;
        if (isPile) {
            offsetX = rect.width / 2;
            offsetY = rect.height / 2;
        }
        let startX = touch.clientX;
        let startY = touch.clientY;

        let longPressActionCompleted = false; // 長押しによる拡大表示が完了したかを示すフラグ

        // 長押しタイマーを開始
        clearTimeout(longPressTimer); // 既存のタイマーがあればクリア
        longPressTimer = setTimeout(() => {
            if (!isDragging && element.classList.contains('card') && !isPile) {
                const cardIdToZoom = element.dataset.cardId;
                const cardZoomOverlay = document.getElementById('card-zoom-overlay');
                const zoomedCardImage = document.getElementById('zoomed-card-image');
                if (cardIdToZoom && cardZoomOverlay && zoomedCardImage) {
                    zoomedCardImage.style.backgroundImage = `url('${CARD_IMAGE_PATH}${cardIdToZoom}.webp')`;
                    cardZoomOverlay.style.display = 'flex';
                    longPressActionCompleted = true; // 長押しアクションが完了したことをマーク
                }
            }
            longPressTimer = null; // タイマー実行後はクリア
        }, LONG_PRESS_DELAY);

        const onMove = (moveEvent) => {
            const moveX = (moveEvent.touches ? moveEvent.touches[0] : moveEvent).clientX;
            const moveY = (moveEvent.touches ? moveEvent.touches[0] : moveEvent).clientY;
            if (Math.abs(moveX - startX) > 5 || Math.abs(moveY - startY) > 5) { // 少しでも動いたら
                if (longPressTimer) { // タイマーがまだ作動していればクリア
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                // longPressActionCompleted はタイマーが発動しなければ false のまま
                const cardZoomOverlay = document.getElementById('card-zoom-overlay');
                if (cardZoomOverlay.style.display === 'flex') {
                    cardZoomOverlay.style.display = 'none'; // 拡大表示もキャンセル
                }

                if (!isDragging) { // ドラッグ開始の処理
                    isDragging = true;
                    if (!isPile && element) element.style.opacity = '0.5'; // elementが存在する場合のみ
                      // draggedCardData がこの時点で必要
                    if (draggedCardData) { // draggedCardData が有効な場合のみビジュアルを作成
                        draggedCardVisual = document.createElement('div');
                        draggedCardVisual.className = 'card dragging';
                        
                        // 山札からのドラッグの場合は裏面を表示
                        if (isPile && sourceInfo.zoneId === 'deck') {
                            draggedCardVisual.style.backgroundImage = `url('items/back.webp')`;
                        } else {
                            draggedCardVisual.style.backgroundImage = `url('${CARD_IMAGE_PATH}${draggedCardData.cardId}.webp')`;
                        }
                        
                        if (draggedCardData.isStandby) draggedCardVisual.style.transform = 'rotate(90deg)';
                        document.body.appendChild(draggedCardVisual);
                    }
                }
            }
            if (isDragging && draggedCardVisual) {
                draggedCardVisual.style.left = `${moveX - offsetX}px`;
                draggedCardVisual.style.top = `${moveY - offsetY}px`;
            }
        };

        const onEnd = (endEvent) => {
            if (longPressTimer) { // タイマーがまだ作動していれば（つまり、長押し完了前に終了した場合）
                clearTimeout(longPressTimer);
                longPressTimer = null;
                // longPressActionCompleted は false のまま
            }
            // longPressTimerがnullでも、longPressActionCompletedがtrueなら長押しが完了している

            const cardZoomOverlay = document.getElementById('card-zoom-overlay');
            if (cardZoomOverlay.style.display === 'flex') {
                cardZoomOverlay.style.display = 'none';
            }

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
            if (!isPile && element) element.style.opacity = '1'; // elementが存在する場合のみ
              if (isDragging) {
                if (draggedCardData) { // ドラッグデータがある場合のみ処理
                    const endX = (endEvent.changedTouches ? endEvent.changedTouches[0] : endEvent).clientX;
                    const endY = (endEvent.changedTouches ? endEvent.changedTouches[0] : endEvent).clientY;
                    const targetEl = document.elementFromPoint(endX, endY);
                    let dropped = false;
                    const targetSlot = targetEl ? targetEl.closest('.card-slot.drop-zone') : null;
                    const targetNonSlotZone = targetEl ? targetEl.closest('.zone.drop-zone:not(#stage-zone):not(#direction-zone):not(#temporary-expanded-zone), .temporary-zone-card-area.drop-zone') : null;
                    const targetExpandedTrash = targetEl ? targetEl.closest('#trash-expanded-zone') : null;
                    const targetTemporaryZone = targetEl ? (targetEl.closest('#temporary-expanded-zone') || targetEl.closest('.temporary-zone-card-area')) : null; // まず元の場所からカードを削除
                    removeCardFromState(draggedCardData, sourceInfo);

                    // ドロップ先を判定してから移動処理を実行
                    if (targetSlot) {
                        const targetInfo = {
                            zoneId: targetSlot.dataset.zoneId,
                            slotIndex: targetSlot.dataset.slotIndex,
                            slotColor: targetSlot.dataset.slotColor
                        };
                        if (addCardToState(draggedCardData, targetInfo)) {
                            dropped = true;
                        }
                    } else if (targetNonSlotZone) {
                        if (addCardToState(draggedCardData, { zoneId: targetNonSlotZone.dataset.zoneId })) {
                            dropped = true;
                        }
                    } else if (targetExpandedTrash && targetExpandedTrash.style.display === 'flex') {
                        if (addCardToState(draggedCardData, { zoneId: 'trash' })) {
                            dropped = true;
                        }                    } else if (targetTemporaryZone && document.getElementById('temporary-expanded-zone').style.display === 'flex') {
                        if (addCardToState(draggedCardData, { zoneId: 'temporary' })) {
                            dropped = true;
                        }
                    }
                    
                    if (!dropped) { // いずれのドロップ先でも成功しなかった場合、元の場所に戻す
                        addCardToState(draggedCardData, sourceInfo); 
                    }
                }
                if (draggedCardVisual) draggedCardVisual.style.display = 'none'; // ドラッグ中のビジュアルを隠す
            } else {
                // ドラッグでなければタップとして処理
                // ただし、長押しアクションが完了した場合はタップ処理をスキップ
                if (!longPressActionCompleted) {
                    if (isPile) {
                        handleTap(element, { zoneId: sourceInfo.zoneId }); // パイルゾーンのタップ
                    } else {
                        handleTap(element, sourceInfo); // カードのタップ
                    }
                }
            }
              // ドラッグビジュアルの確実な削除
            try {
                if (draggedCardVisual) {
                    draggedCardVisual.remove();
                    draggedCardVisual = null;
                }
            } catch (error) {
                console.warn('[onEnd] Error removing drag visual:', error);
                draggedCardVisual = null;
            }
            
            // 孤立したドラッグビジュアルの削除
            document.querySelectorAll('.card.dragging').forEach(el => {
                try {
                    el.remove();
                } catch (error) {
                    console.warn('[onEnd] Error removing orphaned drag visual:', error);
                }
            });
            
            // ドラッグ状態のリセット
            isDragging = false;
            draggedCardData = null;
            
            renderAll();
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }    function removeCardFromState(cardData, fromInfo) {
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
    }    function addCardToState(cardData, toInfo) {
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

    function handleTap(element, tapInfo) {
        const currentTime = performance.now();
        const { zoneId, slotIndex, slotColor } = tapInfo;
        // elementがカードかゾーンかでcardIdの取得方法を変える
        const cardId = element.classList.contains('card') ? element.dataset.cardId : null;

        if (element.classList.contains('pile-zone') && zoneId === 'trash') {
            // トラッシュパイルゾーンがタップされた場合
            const trashExpandedZoneEl = document.getElementById('trash-expanded-zone');
            if (trashExpandedZoneEl.style.display === 'flex') { // 表示判定を 'flex' に
                trashExpandedZoneEl.style.display = 'none';
            } else {
                // トラッシュゾーンを開く前にソートする
                if (gameState.initialDeckOrder && gameState.initialDeckOrder.length > 0) {
                    gameState.zones.trash.sort((cardIdA, cardIdB) => {
                        const indexA = gameState.initialDeckOrder.indexOf(cardIdA);
                        const indexB = gameState.initialDeckOrder.indexOf(cardIdB);
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                }
                trashExpandedZoneEl.style.display = 'flex'; // 表示を 'flex' に
            }
            renderAll(); // 展開ゾーンのカードを再描画
            return; // 他のタップ処理は行わない
        }
        // 山札パイルゾーンがタップされた場合の処理は既存のまま (カードを引く)
        // 「山札からサーチ」ボタンの処理は setupEventListeners で個別に行う
        // 「VOLノイズからサーチ」ボタンの処理は setupEventListeners で個別に行う
        // 「テンポラリーゾーンを開く」ボタンの処理は setupEventListeners で個別に行う
        if (element.classList.contains('pile-zone')) {
            if (zoneId === 'deck' && gameState.zones.deck.length > 0) {
                // テンポラリーゾーンが開いているか確認
                const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
                if (temporaryExpandedZoneEl.style.display === 'flex') {
                    // テンポラリーゾーンにカードを追加
                    const topCard = gameState.zones.deck.pop();
                    if (topCard) {
                        gameState.zones.temporary.push(topCard);
                    }
                } else {
                    // 通常通り手札にカードを追加
                    gameState.zones.hand.push(gameState.zones.deck.pop());
                }
            } else if (zoneId === 'volNoise' && gameState.zones.volNoise && gameState.zones.volNoise.length > 0) {
                // VOLノイズゾーンがタップされた場合
                const topCard = gameState.zones.volNoise.pop();
                if (topCard) { // stringのはずだが念のため確認
                    gameState.zones.hand.push(topCard);
                }
            }
            lastTapTime = 0;
            lastTapTargetCardId = null;
        } else if (cardId) { // cardId が存在する場合のみ（カードのタップ）
            if (currentTime - lastTapTime <= DOUBLE_TAP_THRESHOLD && lastTapTargetCardId === cardId) {
                // Double tap detected
                // ここでカード拡大表示などの処理を将来的に追加可能
                lastTapTime = 0;
            } else {
                lastTapTime = currentTime;
                lastTapTargetCardId = cardId;
                // シングルタップ時の処理 (スタンバイ切り替えなど)
                if (zoneId === 'direction' || zoneId === 'stage') {
                    let slotArray;
                    if (zoneId === 'direction') slotArray = gameState.zones.direction[slotIndex];
                    else if (zoneId === 'stage') slotArray = gameState.zones.stage[slotIndex][slotColor];
                    
                    if (slotArray && slotArray.length > 0) {
                        const topCard = slotArray[slotArray.length - 1];
                        if (cardId === topCard.cardId) { // タップされたカードがスタックの一番上か確認
                            topCard.isStandby = !topCard.isStandby;
                        }
                    }
                }
            }
        }
        renderAll();
    }

    function mulliganHand() {
        if (gameState.zones.hand.length === 0) return;
        gameState.zones.deck = shuffle(gameState.zones.deck.concat(gameState.zones.hand));
        gameState.zones.hand = [];
        for (let i = 0; i < 7; i++) {
            if (gameState.zones.deck.length > 0) {
                gameState.zones.hand.push(gameState.zones.deck.pop());
            }
        }
        renderAll();
    }

    function moveHandToTrash() {
        gameState.zones.trash = gameState.zones.trash.concat(gameState.zones.hand);
        gameState.zones.hand = [];
        renderAll();
    }

    function sortHand() {
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
        renderAll();
    }

    function swapStageColumns(index1, index2) {
        if (index1 === index2) return; // 同じ列なら何もしない

        // gameState.zones.stage の内容をディープコピーして入れ替え
        const tempColumnData = JSON.parse(JSON.stringify(gameState.zones.stage[index1]));
        gameState.zones.stage[index1] = JSON.parse(JSON.stringify(gameState.zones.stage[index2]));
        gameState.zones.stage[index2] = tempColumnData;
    }

    // 現在のプレイヤーのカウンターを取得する関数
    function getCurrentPlayerCounters() {
        if (gameState.isDualMode) {
            return gameState.players[gameState.currentPlayer].counters;
        } else {
            // 一人モードの場合は、従来の gameState.counters を使用
            return gameState.counters || gameState.players[1].counters;
        }
    }    // イベントリスナーをクリアする関数
    function clearEventListeners() {
        // カウンターボタンのイベントリスナーをクリア
        document.querySelectorAll('.counter-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // チェンジボタンのイベントリスナーをクリア
        document.querySelectorAll('.change-stage-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
          // その他のボタンのイベントリスナーをクリア
        const buttonIds = [
            'mulligan-btn', 'move-hand-to-trash-btn', 'sort-hand-btn',
            'shuffle-btn', 'search-deck-btn', 'search-volnoise-btn',
            'open-temporary-zone-btn', 'draw-btn', 'draw-bottom-deck-btn',
            'switch-player-btn', 'turn-end-btn', 'reset-btn', 'change-mat-btn',
            'roll-dice-btn'
        ];
        
        buttonIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
        
        // パイルゾーンのイベントリスナーをクリア
        const zoneIds = ['trash-zone', 'deck-zone', 'volNoise-zone'];
        zoneIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    function setupEventListeners() {
        document.getElementById('mulligan-btn').addEventListener('click', mulliganHand);
        document.getElementById('move-hand-to-trash-btn').addEventListener('click', moveHandToTrash);
        document.getElementById('sort-hand-btn').addEventListener('click', sortHand); // 手札ソートボタンのリスナーを追加
        
        // パイルゾーンのイベントリスナー
        const trashZoneEl = document.getElementById('trash-zone');
        trashZoneEl.addEventListener('mousedown', e => handlePressStart(e, trashZoneEl, 'trash'));
        trashZoneEl.addEventListener('touchstart', e => handlePressStart(e, trashZoneEl, 'trash'), { passive: false });

        const deckZoneEl = document.getElementById('deck-zone');
        deckZoneEl.addEventListener('mousedown', e => handlePressStart(e, deckZoneEl, 'deck'));
        deckZoneEl.addEventListener('touchstart', e => handlePressStart(e, deckZoneEl, 'deck'), { passive: false });

        const volNoiseZoneEl = document.getElementById('volNoise-zone'); // IDを 'vol-noise-zone' から 'volNoise-zone' に修正
        volNoiseZoneEl.addEventListener('mousedown', e => handlePressStart(e, volNoiseZoneEl, 'volNoise'));
        volNoiseZoneEl.addEventListener('touchstart', e => handlePressStart(e, volNoiseZoneEl, 'volNoise'), { passive: false });
        document.querySelectorAll('.counter-btn').forEach(btn => btn.addEventListener('click', () => {
            const { counter, amount } = btn.dataset;
            const delta = Number.parseInt(amount, 10);
            if (!counter || Number.isNaN(delta)) {
                console.warn('[counter-btn] invalid dataset', { counter, amount });
                return;
            }
            const currentPlayerCounters = getCurrentPlayerCounters();
            const prev = Number(currentPlayerCounters[counter]) || 0;
            const next = Math.max(0, prev + delta);
            currentPlayerCounters[counter] = next;
            renderAll();
        }));
        document.getElementById('shuffle-btn').addEventListener('click', () => {
            shuffle(gameState.zones.deck);
            displayShuffleMessage();
            renderAll();
        });
        document.getElementById('search-deck-btn').addEventListener('click', () => { // 山札からサーチボタン
            const deckExpandedZoneEl = document.getElementById('deck-expanded-zone');
            if (deckExpandedZoneEl.style.display === 'flex') {
                deckExpandedZoneEl.style.display = 'none';
                shuffle(gameState.zones.deck); // 山札をシャッフル
                displayShuffleMessage();
                renderAll(); // 表示を更新
            } else {
                deckExpandedZoneEl.style.display = 'flex';
                renderAll(); // 展開ゾーンのカードを再描画
            }
        });
        document.getElementById('search-volnoise-btn').addEventListener('click', () => { // VOLノイズからサーチボタンのイベントリスナー
            const volNoiseExpandedZoneEl = document.getElementById('volnoise-expanded-zone');
            if (volNoiseExpandedZoneEl.style.display === 'flex') {
                volNoiseExpandedZoneEl.style.display = 'none';
            } else {
                volNoiseExpandedZoneEl.style.display = 'flex';
            }
            renderAll(); // 展開ゾーンのカードを再描画
        });
        
        document.getElementById('open-temporary-zone-btn').addEventListener('click', () => {
            const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
            if ( temporaryExpandedZoneEl.style.display === 'flex') {
                temporaryExpandedZoneEl.style.display = 'none';
                // テンポラリーゾーンを閉じた時にボタンの状態を更新
                updateTemporaryButtonState();
            } else {
                temporaryExpandedZoneEl.style.display = 'flex';
            }
            renderAll();
        });
        document.getElementById('temp-to-trash-btn').addEventListener('click', () => {
            if (gameState.zones.temporary.length > 0) {
                gameState.zones.trash.push(...gameState.zones.temporary);
                gameState.zones.temporary = [];
                renderAll();
                const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
                temporaryExpandedZoneEl.style.display = 'none'; // ゾーンを閉じる
            }
        });
        document.getElementById('temp-to-deck-shuffle-btn').addEventListener('click', () => {
            if (gameState.zones.temporary.length > 0) {
                gameState.zones.deck.push(...gameState.zones.temporary);
                gameState.zones.temporary = [];
                shuffle(gameState.zones.deck);
                displayShuffleMessage(); // シャッフルメッセージを表示
                renderAll();
                const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
                temporaryExpandedZoneEl.style.display = 'none'; // ゾーンを閉じる
            }
        });
        
        document.getElementById('temp-to-deck-bottom-btn').addEventListener('click', () => {
            if (gameState.zones.temporary.length > 0) {
                shuffle(gameState.zones.temporary); // まずテンポラリーゾーンのカードをシャッフル
                gameState.zones.deck.unshift(...gameState.zones.temporary); // 山札の先頭（底）に追加
                gameState.zones.temporary = [];
                renderAll();
            }
        });
        document.getElementById('temp-hand-to-temporary-btn').addEventListener('click', () => { // 手札を全てテンポラリーゾーンへ送るボタン
            if (gameState.zones.hand.length > 0) {
               
                gameState.zones.temporary.push(...gameState.zones.hand);
                gameState.zones.hand = [];
                renderAll();
            }
        });
        
        document.getElementById('switch-player-btn').addEventListener('click', () => {
            switchPlayerOnly();
        });
        document.getElementById('turn-end-btn').addEventListener('click', () => {
            // ステージ上のカードのスタンバイ状態を解除
            gameState.zones.stage.forEach(column => {
                ['green', 'blue', 'red'].forEach(color => {
                    if (column[color]) {
                        column[color].forEach(card => {
                            if (card.isStandby) {
                                card.isStandby = false;
                            }
                        });
                    }
                });
            });
            // ディレクションゾーンのカードのスタンバイ状態を解除
            gameState.zones.direction.forEach(slotArray => {
                if (slotArray) {
                    slotArray.forEach(card => {
                        if (card.isStandby) {
                            card.isStandby = false;
                        }
                    });
                }
            });
            
            // TURN ENDメッセージを表示
            displayTurnEndMessage();
            
            // 2デッキモードの場合とシングルモードで処理を分ける
            if (gameState.isDualMode) {
                // 2デッキモード：プレイヤーを切り替えて、新しいプレイヤーが1枚ドロー
                setTimeout(() => {
                    switchPlayer();
                    // プレイヤー切り替え後に新しいプレイヤーが1枚ドロー
                    if (gameState.zones.deck.length > 0) {
                        const drawnCard = gameState.zones.deck.pop();
                        gameState.zones.hand.push(drawnCard);
                    }
                    renderAll();
                }, 1000); // TURN ENDメッセージ表示後に切り替え
            } else {
                // シングルモード：従来通りターンカウンターを進めて1枚ドロー
                gameState.counters.turn++;
                if (gameState.zones.deck.length > 0) {
                    const drawnCard = gameState.zones.deck.pop();
                    gameState.zones.hand.push(drawnCard);
                }
                renderAll();
            }
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            showResetPopup();
        });
        document.getElementById('change-mat-btn').addEventListener('click', changeBackground);

        // 山札の下からドローボタンのイベントリスナー
        document.getElementById('draw-bottom-deck-btn').addEventListener('click', () => {
            if (gameState.zones.deck.length > 0) {
                const bottomCard = gameState.zones.deck.shift(); // 配列の先頭（一番下）のカードを取り出す
                if (bottomCard) {
                    // テンポラリーゾーンが開いているか確認
                    const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone');
                    if (temporaryExpandedZoneEl.style.display === 'flex') {
                        gameState.zones.temporary.push(bottomCard);
                    } else {
                        gameState.zones.hand.push(bottomCard);
                    }
                    renderAll();
                }
            } else {
                alert('山札がありません。');
            }
        });

        // ダイスロールボタンのイベントリスナー
        document.getElementById('roll-dice-btn').addEventListener('click', () => {
            const diceContainerEl = document.getElementById('dice-container');
            const diceResultEl = document.createElement('div'); // 新しいダイス要素を作成
            diceResultEl.className = 'dice-result';

            const roll = Math.floor(Math.random() * 6) + 1; // 1～6の乱数
            diceResultEl.style.backgroundImage = `url('items/dice${roll}.webp')`; // 画像変更
            diceResultEl.style.display = 'flex';
            diceContainerEl.appendChild(diceResultEl); // コンテナに追加

            setTimeout(() => {
                diceResultEl.style.opacity = '0'; // 透明にする
                setTimeout(() => {
                    diceResultEl.remove(); // DOMから削除
                }, 1000); // フェードアウト時間
            }, 1500);
        });

        // ステージ列チェンジボタンのイベントリスナー
        document.querySelectorAll('.change-stage-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const button = event.target;
                const columnIndex = parseInt(button.dataset.columnIndex, 10);

                const indexInSelected = selectedChangeColumns.indexOf(columnIndex);

                if (indexInSelected > -1) { // すでに選択されている場合：選択解除
                    selectedChangeColumns.splice(indexInSelected, 1);
                    button.classList.remove('selected');
                } else { // 新規選択の場合
                    if (selectedChangeColumns.length < 2) {
                        selectedChangeColumns.push(columnIndex);
                        button.classList.add('selected');

                        if (selectedChangeColumns.length === 2) {
                            swapStageColumns(selectedChangeColumns[0], selectedChangeColumns[1]);
                            // 選択状態をリセット
                            document.querySelectorAll('.change-stage-btn.selected').forEach(b => b.classList.remove('selected'));
                            selectedChangeColumns = [];
                            renderAll(); // gameStateが変更されたので再描画
                        }
                    }
                    // 3つ目以降の選択は無視（既に2つ選択されていれば上記if内で処理・リセットされるため）
                }
            });
        });

        // ドキュメント全体のクリックで展開トラッシュゾーンを閉じる処理
        document.addEventListener('click', (event) => {
            const trashExpandedZoneEl = document.getElementById('trash-expanded-zone');
            const trashZoneEl = document.getElementById('trash-zone'); // トラッシュパイルの要素
            const deckExpandedZoneEl = document.getElementById('deck-expanded-zone'); // 山札展開ゾーンの要素
            const searchDeckBtnEl = document.getElementById('search-deck-btn'); // 山札サーチボタンの要素
            const volNoiseExpandedZoneEl = document.getElementById('volnoise-expanded-zone'); // VOLノイズ展開ゾーンの要素
            const searchVolNoiseBtnEl = document.getElementById('search-volnoise-btn'); // VOLノイズサーチボタンの要素
            const temporaryExpandedZoneEl = document.getElementById('temporary-expanded-zone'); // テンポラリー展開ゾーンの要素
            const openTemporaryBtnEl = document.getElementById('open-temporary-zone-btn'); // テンポラリーゾーンを開くボタンの要素

            // 展開トラッシュゾーンが表示されているか確認
            if (trashExpandedZoneEl.style.display === 'flex') {
                // クリックがトラッシュパイルアイコン（トグルボタンとして機能）で発生したか確認
                if (trashZoneEl.contains(event.target)) {
                    // トラッシュパイルアイコンがクリックされた場合は、既存のhandleTapに任せる
                    return;
                }
                // クリックが展開トラッシュゾーン内部で発生したか確認
                if (trashExpandedZoneEl.contains(event.target)) {
                    // 展開トラッシュゾーン内部のクリックは無視（カード操作のため）
                    return;
                }
                trashExpandedZoneEl.style.display = 'none';
            }

            // 展開山札ゾーンが表示されているか確認
            if (deckExpandedZoneEl.style.display === 'flex') {
                // クリックが山札サーチボタンで発生したか確認
                if (searchDeckBtnEl.contains(event.target)) {
                    // 山札サーチボタンがクリックされた場合は、ボタンのイベントリスナーに任せる
                    return;
                }
                // クリックが展開山札ゾーン内部で発生したか確認
                if (deckExpandedZoneEl.contains(event.target)) {
                    // 展開山札ゾーン内部のクリックは無視（カード操作のため）
                    return;
                }
                deckExpandedZoneEl.style.display = 'none';
                shuffle(gameState.zones.deck); // 山札をシャッフル
                displayShuffleMessage();
                renderAll(); // 表示を更新
            }

            // 展開VOLノイズゾーンが表示されているか確認
            if (volNoiseExpandedZoneEl.style.display === 'flex') {
                // クリックがVOLノイズサーチボタンで発生したか確認
                if (searchVolNoiseBtnEl.contains(event.target)) {
                    return;
                }
                // クリックが展開VOLノイズゾーン内部で発生したか確認
                if (volNoiseExpandedZoneEl.contains(event.target)) {
                    return;
                }
                volNoiseExpandedZoneEl.style.display = 'none';
            }

            // 展開テンポラリーゾーンが表示されているか確認
            if (temporaryExpandedZoneEl.style.display === 'flex') {                if (openTemporaryBtnEl.contains(event.target) || temporaryExpandedZoneEl.contains(event.target)) {
                    // 開くボタン自身、またはゾーン内部（ボタンやカードエリア含む）のクリックは無視
                    return;
                }
                temporaryExpandedZoneEl.style.display = 'none';
            }
        });

        // リセットポップアップのイベントリスナー
        document.getElementById('reset-to-deck-select').addEventListener('click', () => {
            hideResetPopup();
            // デッキ選択画面に戻る
            showDeckInputScreen();
            // クッキーからデッキデータを復元
            loadDeckDataFromCookie();
            // モバイル全画面ボタンの表示状態を更新
            updateMobileFullscreenButton();
        });
        
        document.getElementById('reset-same-deck').addEventListener('click', () => {
            hideResetPopup();
            // 同じデッキでリセット
            if (gameState.isDualMode) {
                // 二人対戦モードの場合
                const currentDeck1 = gameState.players[1].zones.deck.concat(
                    gameState.players[1].zones.hand,
                    gameState.players[1].zones.stage.flatMap(col => [...col.red, ...col.blue, ...col.green]),
                    gameState.players[1].zones.direction.flat(),
                    gameState.players[1].zones.trash,
                    gameState.players[1].zones.volNoise,
                    gameState.players[1].zones.temporary
                ).filter(card => card !== null);
                
                const currentDeck2 = gameState.players[2].zones.deck.concat(
                    gameState.players[2].zones.hand,
                    gameState.players[2].zones.stage.flatMap(col => [...col.red, ...col.blue, ...col.green]),
                    gameState.players[2].zones.direction.flat(),
                    gameState.players[2].zones.trash,
                    gameState.players[2].zones.volNoise,
                    gameState.players[2].zones.temporary
                ).filter(card => card !== null);
                
                initGameState(currentDeck1, true, currentDeck2);
            } else {
                // 一人モードの場合
                const currentDeck = gameState.initialDeckOrder.slice();
                initGameState(currentDeck, false);
            }
            renderAll();
        });
        
        document.getElementById('reset-cancel').addEventListener('click', () => {
            hideResetPopup();
        });

        document.getElementById('reset-swap-players').addEventListener('click', () => {
            hideResetPopup();
            // 先後を入れ替えてリセット（二人対戦モードのみ）
            if (gameState.isDualMode) {
                const currentDeck1 = gameState.players[1].zones.deck.concat(
                    gameState.players[1].zones.hand,
                    gameState.players[1].zones.stage.flatMap(col => [...col.red, ...col.blue, ...col.green]),
                    gameState.players[1].zones.direction.flat(),
                    gameState.players[1].zones.trash,
                    gameState.players[1].zones.volNoise,
                    gameState.players[1].zones.temporary
                ).filter(card => card !== null);
                
                const currentDeck2 = gameState.players[2].zones.deck.concat(
                    gameState.players[2].zones.hand,
                    gameState.players[2].zones.stage.flatMap(col => [...col.red, ...col.blue, ...col.green]),
                    gameState.players[2].zones.direction.flat(),
                    gameState.players[2].zones.trash,
                    gameState.players[2].zones.volNoise,
                    gameState.players[2].zones.temporary
                ).filter(card => card !== null);
                
                // デッキを入れ替えて初期化（プレイヤー1が元のプレイヤー2のデッキ、プレイヤー2が元のプレイヤー1のデッキ）
                initGameState(currentDeck2, true, currentDeck1);
                renderAll();
            }
        });// ポップアップオーバーレイをクリックした時にポップアップを閉じる
        document.getElementById('reset-popup-overlay').addEventListener('click', (event) => {
            if (event.target === document.getElementById('reset-popup-overlay')) {
                hideResetPopup();
            }
        });
        
        // 相手の盤面を見るボタンのイベントリスナー
        const viewOpponentBtn = document.getElementById('view-opponent-btn');
        
        // マウスダウン・タッチスタートで表示
        viewOpponentBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            showOpponentFullscreen();
        });
        
        viewOpponentBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showOpponentFullscreen();
        });
        
        // マウスアップ・タッチエンド・マウスリーブで非表示
        viewOpponentBtn.addEventListener('mouseup', () => {
            hideOpponentFullscreen();
        });
        
        viewOpponentBtn.addEventListener('mouseleave', () => {
            hideOpponentFullscreen();
        });
        
        viewOpponentBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            hideOpponentFullscreen();
        });
        
        viewOpponentBtn.addEventListener('touchcancel', () => {
            hideOpponentFullscreen();
        });
        
        // 全画面表示をクリックした時に非表示
        document.getElementById('opponent-fullscreen').addEventListener('click', () => {
            hideOpponentFullscreen();
        });
    }
    
    // リセットポップアップを表示
    function showResetPopup() {
        // 二人対戦モードの場合のみ「先後を入れ替えてもう一度」ボタンを表示
        const swapPlayersBtn = document.getElementById('reset-swap-players');        if (gameState.isDualMode) {
            swapPlayersBtn.style.display = 'block';
        } else {
            swapPlayersBtn.style.display = 'none';
        }
        document.getElementById('reset-popup-overlay').style.display = 'flex';
    }
      // リセットポップアップを非表示
    function hideResetPopup() {
        document.getElementById('reset-popup-overlay').style.display = 'none';
    }
    
    // クッキー管理関数
    function setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // GitHub Pages対応のクッキー設定
        let cookieString = `${name}=${value};expires=${expires.toUTCString()}`;
        
        // HTTPSの場合（GitHub Pages）はSecure属性を追加
        if (location.protocol === 'https:') {
            cookieString += ';Secure';
        }
        
        // SameSite属性を追加（モダンブラウザ対応）
        cookieString += ';SameSite=Lax';
        
        // パスを設定（GitHub Pagesのサブディレクトリ対応）
        const currentPath = location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        cookieString += `;path=${basePath || '/'}`;
        
        document.cookie = cookieString;
    }
    
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const value = c.substring(nameEQ.length, c.length);
                return value;
            }
        }
        return null;
    }
    
    function loadBackgroundFromCookie() {
        const savedBackground = getCookie('playmat-background');
        
        if (savedBackground) {
            if (savedBackground === 'none') {
                document.body.style.backgroundImage = '';
            } else {
                setBackgroundWithCheck(savedBackground);
            }
        }
    }

    // デッキデータをクッキーに保存する関数
    function saveDeckDataToCookie() {
        const singleDeck = document.getElementById('deck-string').value.trim();
        const dualDeckP1 = document.getElementById('deck-string-p1').value.trim();
        const dualDeckP2 = document.getElementById('deck-string-p2').value.trim();
        
        setCookie('deck-single', singleDeck, 30);
        setCookie('deck-p1', dualDeckP1, 30);
        setCookie('deck-p2', dualDeckP2, 30);
    }

    // クッキーからデッキデータを読み込む関数
    function loadDeckDataFromCookie() {
        const savedSingleDeck = getCookie('deck-single');
        const savedDeckP1 = getCookie('deck-p1');
        const savedDeckP2 = getCookie('deck-p2');
        
        if (savedSingleDeck) {
            document.getElementById('deck-string').value = savedSingleDeck;
        }
        
        if (savedDeckP1) {
            document.getElementById('deck-string-p1').value = savedDeckP1;
        }
        
        if (savedDeckP2) {
            document.getElementById('deck-string-p2').value = savedDeckP2;
        }
    }

    // デッキデータをクリアする関数
    function clearDeckData(deckType) {
        switch (deckType) {
            case 'single':
                document.getElementById('deck-string').value = '';
                setCookie('deck-single', '', 30);
                break;
            case 'p1':
                document.getElementById('deck-string-p1').value = '';
                setCookie('deck-p1', '', 30);
                break;
            case 'p2':
                document.getElementById('deck-string-p2').value = '';
                setCookie('deck-p2', '', 30);
                break;
        }
    }
    
    function changeBackground() {
        const currentBg = document.body.style.backgroundImage;
        
        // 現在の背景状態を判定
        if (!currentBg || currentBg === '' || currentBg === 'none') {
            // 未設定 → wall.webp
            setBackgroundWithCheck('items/wall.webp');
            setCookie('playmat-background', 'items/wall.webp');
        } else if (currentBg.includes('wall.webp') && !currentBg.includes('wall1.webp') && !currentBg.includes('wall2.webp')) {
            // wall.webp → wall1.webp
            setBackgroundWithCheck('items/wall1.webp');
            setCookie('playmat-background', 'items/wall1.webp');
        } else if (currentBg.includes('wall1.webp')) {
            // wall1.webp → wall2.webp
            setBackgroundWithCheck('items/wall2.webp');
            setCookie('playmat-background', 'items/wall2.webp');
        } else if (currentBg.includes('wall2.webp')) {
            // wall2.webp → 未設定
            document.body.style.backgroundImage = '';
            setCookie('playmat-background', 'none');
        } else {
            // 不明な状態の場合は未設定に戻す
            document.body.style.backgroundImage = '';
            setCookie('playmat-background', 'none');
        }
    }
    
    function setBackgroundWithCheck(imagePath) {
        // 画像の存在確認
        const img = new Image();
        img.onload = function() {
            // 画像が正常に読み込めた場合
            document.body.style.backgroundImage = `url('${imagePath}')`;
        };
        img.onerror = function() {
            // 画像が見つからない場合は未設定に戻す
            console.warn(`Background image not found: ${imagePath}`);
            document.body.style.backgroundImage = '';
            setCookie('playmat-background', 'none');        };
        img.src = imagePath;
    }    // 認証設定
    // パスワードのSHA-256ハッシュ値（元のパスワード: newpassword456）
    const CORRECT_PASSWORD_HASH = '9d2a18cc82a3b5bf3d932c1f562f7043066b3fb777d4e00b4dec71de2b8bc5b5'; // SHA-256 hash of "newpassword456"
    const AUTH_COOKIE_NAME = 'kamitsubaki-auth';
    const AUTH_EXPIRY_DAYS = 30; // 認証の有効期限（日数）
    
    // パスワードをSHA-256でハッシュ化する関数
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    // 認証チェック
    function checkAuthentication() {
        const authCookie = getCookie(AUTH_COOKIE_NAME);
        const isAuthenticated = authCookie === 'authenticated';
        
        if (isAuthenticated) {
            showDeckInputScreen();
        } else {
            showPasswordScreen();
        }
    }
    
    // パスワード画面を表示
    function showPasswordScreen() {
        document.getElementById('password-screen').style.display = 'flex';
        document.getElementById('deck-input-screen').style.display = 'none';
        document.getElementById('game-board').style.display = 'none';
        
        // パスワード入力欄にフォーカス
        setTimeout(() => {
            const passwordInput = document.getElementById('password-input');
            if (passwordInput) passwordInput.focus();
        }, 100);
    }
      // デッキ入力画面を表示
    function showDeckInputScreen() {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('deck-input-screen').style.display = 'flex';
        document.getElementById('game-board').style.display = 'none';
    }
    
    // ゲーム画面を表示
    function showGameScreen() {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('deck-input-screen').style.display = 'none';
        document.getElementById('game-board').style.display = 'flex';
    }
      // パスワード認証処理
    async function authenticatePassword() {
        const passwordInput = document.getElementById('password-input');
        const errorMessage = document.getElementById('password-error');
        const enteredPassword = passwordInput.value.trim();
        
        try {
            // 入力されたパスワードをハッシュ化
            const enteredPasswordHash = await hashPassword(enteredPassword);
            
            if (enteredPasswordHash === CORRECT_PASSWORD_HASH) {
                // 認証成功
                setCookie(AUTH_COOKIE_NAME, 'authenticated', AUTH_EXPIRY_DAYS);
                
                // エラーメッセージを隠す
                errorMessage.style.display = 'none';
                passwordInput.value = '';
                
                // デッキ入力画面へ移動
                showDeckInputScreen();
            } else {
                // 認証失敗
                errorMessage.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
                
                // エラーメッセージを数秒後に自動で隠す
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // パスワード認証のイベントリスナー設定
    function setupPasswordAuthentication() {
        const passwordInput = document.getElementById('password-input');
        const passwordSubmitBtn = document.getElementById('password-submit-btn');
        
        // ボタンクリックで認証
        passwordSubmitBtn.addEventListener('click', authenticatePassword);
        
        // Enterキーで認証
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authenticatePassword();
            }
        });    }    
      // モード選択ボタンのイベントリスナー
    document.getElementById('single-deck-mode-btn').addEventListener('click', () => {
        document.getElementById('single-deck-mode-btn').classList.add('active');
        document.getElementById('dual-deck-mode-btn').classList.remove('active');
        document.getElementById('single-deck-input').style.display = 'block';
        document.getElementById('dual-deck-input').style.display = 'none';
    });
    
    document.getElementById('dual-deck-mode-btn').addEventListener('click', () => {
        document.getElementById('dual-deck-mode-btn').classList.add('active');
        document.getElementById('single-deck-mode-btn').classList.remove('active');
        document.getElementById('single-deck-input').style.display = 'none';
        document.getElementById('dual-deck-input').style.display = 'block';
    });

    // デッキデータ入力欄の変更時にクッキーに保存
    document.getElementById('deck-string').addEventListener('input', () => {
        saveDeckDataToCookie();
    });
    
    document.getElementById('deck-string-p1').addEventListener('input', () => {
        saveDeckDataToCookie();
    });
    
    document.getElementById('deck-string-p2').addEventListener('input', () => {
        saveDeckDataToCookie();
    });

    // クリアボタンのイベントリスナー
    document.getElementById('clear-deck-btn').addEventListener('click', () => {
        clearDeckData('single');
    });
    
    document.getElementById('clear-deck-p1-btn').addEventListener('click', () => {
        clearDeckData('p1');
    });
    
    document.getElementById('clear-deck-p2-btn').addEventListener('click', () => {
        clearDeckData('p2');
    });
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        const isDualMode = document.getElementById('dual-deck-mode-btn').classList.contains('active');
        
        if (isDualMode) {
            let deckString1 = document.getElementById('deck-string-p1').value.trim();
            let deckList1;
            if (!deckString1) { // deckCode.tsの空文字列チェックを適用
                alert('プレイヤー1のデッキコードが空です。');
                return;
            }
            if (deckString1.startsWith('KCG-')) {
                deckList1 = readKCGCode(deckString1);
                if (deckList1.length === 0) {
                    alert('プレイヤー1のKCGコードの解析に失敗しました。正しいコードを入力してください。');
                    return;
                }
            } else {
                deckList1 = deckString1.split('/').filter(id => id.trim() !== ''); // trim()を追加
            }

            let deckString2 = document.getElementById('deck-string-p2').value.trim();
            let deckList2;
            if (!deckString2) { // deckCode.tsの空文字列チェックを適用
                alert('プレイヤー2のデッキコードが空です。');
                return;
            }
            if (deckString2.startsWith('KCG-')) {
                deckList2 = readKCGCode(deckString2);
                if (deckList2.length === 0) {
                    alert('プレイヤー2のKCGコードの解析に失敗しました。正しいコードを入力してください。');
                    return;
                }
            } else {
                deckList2 = deckString2.split('/').filter(id => id.trim() !== ''); // trim()を追加
            }
            
            if (deckList1.length === 0 || deckList2.length === 0) {
                alert('両方のプレイヤーのデッキリストを入力してください。');
                return;
            }
            initGameState(deckList1, true, deckList2);
        } else {
            let deckString = document.getElementById('deck-string').value.trim();
            let deckList;

            if (!deckString) { // deckCode.tsの空文字列チェックを適用
                alert('デッキコードが空です。');
                return;
            }
            if (deckString.startsWith('KCG-')) {
                deckList = readKCGCode(deckString);
                if (deckList.length === 0) {
                    alert('KCGコードの解析に失敗しました。正しいコードを入力してください。');
                    return;
                }
            } else {
                deckList = deckString.split('/').filter(id => id.trim() !== ''); // trim()を追加
            }

            if (deckList.length === 0) {
                alert('有効なデッキリストを入力してください。');
                return;
            }
            initGameState(deckList, false);
        }
          showGameScreen();
        clearEventListeners(); // 既存のイベントリスナーをクリア
        setupEventListeners();
        renderAll();
        updateOpponentPreview();
        
        // ゲーム開始後にモバイル全画面ボタンの表示状態を更新
        setTimeout(updateMobileFullscreenButton, 100);
    });

    // 全画面表示ボタンのイベントリスナー
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Safari
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    });

    // モバイル用全画面表示ボタンのイベントリスナー
    document.getElementById('fullscreen-mobile-btn').addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Safari
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
            document.documentElement.msRequestFullscreen();
        }
    });    // 全画面状態の変化を監視
    function handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        
        if (isFullscreen) {
            document.body.classList.add('fullscreen-mode');
        } else {
            document.body.classList.remove('fullscreen-mode');
        }
        
        // モバイル用ボタンの表示状態を強制更新
        updateMobileFullscreenButton();
    }
      // モバイル用全画面表示ボタンの表示状態を更新
    function updateMobileFullscreenButton() {
        const gameBoard = document.getElementById('game-board');
        const mobileBtn = document.getElementById('fullscreen-mobile-btn');
        const deckInputScreen = document.getElementById('deck-input-screen');
        
        // ゲーム画面が表示されているかチェック（deck-input-screenが非表示でgame-boardが表示されている）
        const isGameVisible = gameBoard && 
                             gameBoard.style.display === 'flex' && 
                             deckInputScreen && 
                             deckInputScreen.style.display === 'none';
        
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        const isMobile = window.innerWidth <= 768 || (window.innerWidth <= 932 && window.innerHeight <= window.innerWidth);
        
        if (mobileBtn) {
            if (isGameVisible && !isFullscreen && isMobile) {
                mobileBtn.style.display = 'block';
            } else {
                mobileBtn.style.display = 'none';
            }
        }
    }
    
    // テンポラリーボタンの状態を更新
    function updateTemporaryButtonState() {
        const openTemporaryZoneBtn = document.getElementById('open-temporary-zone-btn');
        if (openTemporaryZoneBtn) {
            const tempCount = gameState.zones.temporary.length;
            if (tempCount > 0) {
                openTemporaryZoneBtn.textContent = `テンポラリー (${tempCount})`;
                openTemporaryZoneBtn.classList.add('has-cards');
            } else {
                openTemporaryZoneBtn.textContent = 'テンポラリー';
                openTemporaryZoneBtn.classList.remove('has-cards');
            }
        }
    }

    // 全画面状態変化のイベントリスナーを追加
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    // ウィンドウサイズ変更時にも更新
    window.addEventListener('resize', updateMobileFullscreenButton);    // 初期表示状態を設定
    setTimeout(updateMobileFullscreenButton, 100);
      // クッキーから保存されたプレイマット設定を復元
    loadBackgroundFromCookie();

    // デッキデータを復元
    loadDeckDataFromCookie();
    
    // パスワード認証システムの初期化
    setupPasswordAuthentication();
    
    // 認証チェックを実行（認証済みならデッキ選択画面、未認証ならパスワード画面を表示）
    checkAuthentication();

    // Initialize with default deck（認証後にデッキ選択画面で実行される）
    // 初期化はゲーム開始時に行うため、ここでは空のデッキで初期化
    initGameState([]);
    renderAll();    function switchPlayer() {
        if (!gameState.isDualMode || !gameState.players[2]) return;
        
        // 現在のプレイヤーのデータを保存
        gameState.players[gameState.currentPlayer].counters = gameState.counters;
        gameState.players[gameState.currentPlayer].zones = gameState.zones;
        
        // プレイヤーを切り替え
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        
        // 新しいプレイヤーのデータを設定
        gameState.counters = gameState.players[gameState.currentPlayer].counters;
        gameState.zones = gameState.players[gameState.currentPlayer].zones;
        gameState.initialDeckOrder = gameState.players[gameState.currentPlayer].initialDeckOrder;
        
        // ターンが帰ってきた時に赤スロットのカードを全てトラッシュ
        if (gameState.isDualMode) {
            gameState.zones.stage.forEach(column => {
                if (column.red && column.red.length > 0) {
                    // 赤スロットのカードをトラッシュに移動
                    column.red.forEach(card => {
                        gameState.zones.trash.push(card.cardId);
                    });
                    // 赤スロットを空にする
                    column.red = [];
                }
            });
        }
        
        // 新しいプレイヤーのターンカウンターを進める
        gameState.counters.turn++;
        
        // 相手プレビューを更新
        updateOpponentPreview();
        
        // 画面を再描画
        renderAll();
    }

    function switchPlayerOnly() {
        if (!gameState.isDualMode || !gameState.players[2]) return;
        
        // 現在のプレイヤーのデータを保存
        gameState.players[gameState.currentPlayer].counters = gameState.counters;
        gameState.players[gameState.currentPlayer].zones = gameState.zones;
        
        // プレイヤーを切り替え
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        
        // 新しいプレイヤーのデータを設定（ターンは進めない）
        gameState.counters = gameState.players[gameState.currentPlayer].counters;
        gameState.zones = gameState.players[gameState.currentPlayer].zones;
        gameState.initialDeckOrder = gameState.players[gameState.currentPlayer].initialDeckOrder;
        
        // 相手プレビューを更新
        updateOpponentPreview();
        
        // 画面を再描画
        renderAll();
    }
    
    function updateOpponentPreview() {
        if (!gameState.isDualMode) {
            document.getElementById('view-opponent-btn').style.display = 'none';
            document.getElementById('switch-player-btn').style.display = 'none';
            return;
        }
        
        // 相手の盤面を見るボタンを表示
        document.getElementById('view-opponent-btn').style.display = 'block';
        // プレイヤー切り替えボタンを表示
        document.getElementById('switch-player-btn').style.display = 'block';
    }
      function showOpponentFullscreen() {
        if (!gameState.isDualMode) return;
        
        const opponentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        const opponent = gameState.players[opponentPlayer];
        
        if (!opponent) return;
        
        const fullscreen = document.getElementById('opponent-fullscreen');
        fullscreen.style.display = 'flex';
          // 相手の盤面を完全に再現する形で表示
        const boardContent = document.getElementById('opponent-fullscreen-board');        boardContent.innerHTML = `
            <div style="display: flex; height: 80%; gap: 15px; justify-content: flex-start; padding-left: 10px;">
                <!-- 左カラム（VOLノイズ、トラッシュのみ） -->
                <div style="flex: 0 0 65px; display: flex; flex-direction: column; gap: 5px;">
                    <div class="opponent-zone-box" style="text-align: center; width: 60px;">
                        <div class="zone-title" style="font-size: 0.6rem;">VOL</div>
                        <div class="opponent-pile-count" style="font-size: 0.7rem;">${opponent.zones.volNoise.length}</div>
                    </div>
                    <div class="opponent-zone-box" style="text-align: center; width: 60px;">
                        <div class="zone-title" style="font-size: 0.6rem;">トラッシュ</div>
                        <div class="opponent-pile-count" style="font-size: 0.7rem;">${opponent.zones.trash.length}</div>
                    </div>
                </div>
                
                <!-- 中央カラム（ステージとディレクション） -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
                    <!-- ステージゾーン -->
                    <div class="opponent-stage-zone">
                        <div class="zone-title">ステージ</div>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            ${Array.from({length: 5}, (_, i) => `
                                <div class="opponent-stage-column">
                                    <div class="opponent-column-header">列${i + 1}</div>
                                    <div class="opponent-card-slots">                                        ${['green', 'blue', 'red'].map(color => {
                                            const cards = opponent.zones.stage[i][color] || [];
                                            return `<div class="opponent-card-slot opponent-${color}-slot">
                                                ${cards.map((card, cardIndex) => {
                                                    // 緑と赤の場合は被らないように縦方向にずらす
                                                    let transformValue;
                                                    if (color === 'green') {
                                                        // 緑は上方向にずらす（新しいカードが手前）
                                                        const yOffset = (cards.length - 1 - cardIndex) * 12;
                                                        transformValue = `translate(${cardIndex * 2}px, ${yOffset}px)`;
                                                    } else if (color === 'red') {
                                                        // 赤は下方向にずらす
                                                        const yOffset = cardIndex * 15;
                                                        transformValue = `translate(${cardIndex * 2}px, ${yOffset}px)`;
                                                    } else {
                                                        // 青は斜めにずらす（従来通り）
                                                        transformValue = `translate(${cardIndex * 8}px, ${cardIndex * 6}px)`;
                                                    }
                                                    
                                                    return `<div class="opponent-card ${card.isStandby ? 'standby' : ''}" 
                                                         style="z-index: ${cardIndex + 1}; 
                                                                transform: ${transformValue};
                                                                background-image: url('${CARD_IMAGE_PATH}${card.cardId}.webp');
                                                                background-size: 180%;
                                                                background-position: center 40%;">
                                                    </div>`;
                                                }).join('')}
                                            </div>`;
                                        }).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- ディレクションゾーン -->
                    <div class="opponent-direction-zone">
                        <div class="zone-title">Direction</div>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            ${Array.from({length: 5}, (_, i) => {
                                const directionCards = opponent.zones.direction[i] || [];
                                return `                                    <div class="opponent-direction-slot">                                        ${directionCards.map((card, cardIndex) => `                                            <div class="opponent-card ${card.isStandby ? 'standby' : ''}"
                                                 style="z-index: ${cardIndex + 1}; 
                                                        transform: translate(${cardIndex * 8}px, ${cardIndex * 6}px);
                                                        background-image: url('${CARD_IMAGE_PATH}${card.cardId}.webp');
                                                        background-size: 180%;
                                                        background-position: center 40%;">
                                            </div>
                                        `).join('')}
                                    </div>
                                `;                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- 右カラム（山札ゾーン） -->
                <div style="flex: 0 0 70px; display: flex; flex-direction: column; gap: 5px;">
                    <div class="opponent-zone-box" style="text-align: center; width: 60px;">
                        <div class="zone-title" style="font-size: 0.6rem;">山札</div>
                        <div class="opponent-pile-count" style="font-size: 0.7rem;">${opponent.zones.deck.length}</div>
                    </div>
                </div>
            </div>
            
            <!-- 手札エリア -->
            <div class="opponent-hand-area">
                <div class="zone-title">手札 (${opponent.zones.hand.length}枚)</div>
                <div class="opponent-hand-cards">                    ${opponent.zones.hand.map(cardId => `
                        <div class="opponent-hand-card" style="background-image: url('./items/back.webp'); background-size: cover; background-position: center;"></div>
                    `).join('')}
                </div>
            </div>
            
            <!-- カウンター表示 -->
            <div class="opponent-counters-display">
                <div class="opponent-counter">
                    <span class="counter-label">ターン:</span>
                    <span class="counter-value">${opponent.counters.turn}</span>
                </div>
                <div class="opponent-counter">
                    <span class="counter-label">VOL:</span>
                    <span class="counter-value">${opponent.counters.vol}</span>
                </div>
                <div class="opponent-counter">
                    <span class="counter-label">α:</span>
                    <span class="counter-value">${opponent.counters.manaAlpha}</span>
                </div>
                <div class="opponent-counter">
                    <span class="counter-label">β:</span>
                    <span class="counter-value">${opponent.counters.manaBeta}</span>
                </div>
                <div class="opponent-counter">
                    <span class="counter-label">Ω:</span>
                    <span class="counter-value">${opponent.counters.manaOmega}</span>
                </div>
            </div>
        `;
    }

    function hideOpponentFullscreen() {
        document.getElementById('opponent-fullscreen').style.display = 'none';
    }
});
