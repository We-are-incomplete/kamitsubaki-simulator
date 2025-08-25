// ui/eventHandlers.js
import { elements, counters } from './domElements.js';
import { gameState, initGameState, getCurrentPlayerCounters, switchPlayer, switchPlayerOnly } from '../game/gameState.js';
import { shuffle, mulliganHand, moveHandToTrash, sortHand, swapStageColumns, removeCardFromState, addCardToState } from '../game/gameLogic.js';
import { CARD_IMAGE_PATH, DOUBLE_TAP_THRESHOLD, LONG_PRESS_DELAY } from '../constants.js';
import { readKCGCode } from '../utils/deckCodeParser.js';
import { setCookie, getCookie } from '../utils/cookie.js';
import { showDeckInputScreen, showGameScreen } from '../utils/auth.js';

let lastTapTime = 0;
let lastTapTargetCardId = null;
let longPressTimer = null;
let selectedChangeColumns = [];

// UI表示関連関数
export function displayShuffleMessage() {
    if (elements.shuffleMessage) {
        elements.shuffleMessage.style.display = 'block';
        setTimeout(() => {
            elements.shuffleMessage.style.display = 'none';
        }, 500);
    }
}

export function displayTurnEndMessage() {
    if (elements.turnEndMessage) {
        elements.turnEndMessage.style.display = 'block';
        setTimeout(() => {
            elements.turnEndMessage.style.display = 'none';
        }, 1000);
    }
}

export function renderAll() {
    document.querySelectorAll('.card, .zone-count').forEach(el => el.remove());
    ['deck', 'trash', 'volNoise'].forEach(zoneId => {
        const zoneEl = elements[`${zoneId}Zone`];
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
    elements.handZone.querySelectorAll('.card').forEach(cardEl => cardEl.remove());
    gameState.zones.hand.forEach(cardId => {
        elements.handZone.appendChild(createCardElement(cardId, false, 'hand', 'drag'));
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
    elements.trashExpandedZone.innerHTML = '';
    if (elements.trashExpandedZone.style.display === 'flex') { 
        gameState.zones.trash.forEach(cardId => {
            const cardElement = createCardElement(cardId, false, 'trash-expanded', 'drag'); 
            elements.trashExpandedZone.appendChild(cardElement);
        });
    }
    elements.deckExpandedZone.innerHTML = '';
    if (elements.deckExpandedZone.style.display === 'flex') {
        for (let i = gameState.zones.deck.length - 1; i >= 0; i--) {
            const cardId = gameState.zones.deck[i];
            const cardElement = createCardElement(cardId, false, 'deck-expanded', 'drag');
            elements.deckExpandedZone.appendChild(cardElement);
        }
    }
    elements.volnoiseExpandedZone.innerHTML = '';
    if (elements.volnoiseExpandedZone.style.display === 'flex') {
        gameState.zones.volNoise.forEach(cardId => {
            const cardElement = createCardElement(cardId, false, 'volnoise-expanded', 'drag');
            elements.volnoiseExpandedZone.appendChild(cardElement);
        });
    }
    elements.temporaryCardArea.innerHTML = '';
    if (elements.temporaryExpandedZone.style.display === 'flex') {
        gameState.zones.temporary.forEach(cardId => {
            const cardElement = createCardElement(cardId, false, 'temporary-expanded', 'drag');
            elements.temporaryCardArea.appendChild(cardElement);
        });
    }
    updateTemporaryButtonState();
}

export function createCardElement(cardId, isStandby, zoneId, interactiveType, slotIndex, slotColor) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    const actualCardId = (typeof cardId === 'object' && cardId !== null) ? cardId.cardId : cardId;
    cardEl.dataset.cardId = actualCardId;

    if ((zoneId === 'deck' || zoneId === 'volNoise') && interactiveType === 'none') {
         cardEl.style.backgroundImage = `url('items/back.webp')`;
    } else if (actualCardId && typeof actualCardId === 'string' && actualCardId.trim() !== '') {
         cardEl.style.backgroundImage = `url('${CARD_IMAGE_PATH}${actualCardId}.webp')`;
    } else {           
         cardEl.style.backgroundImage = `url('items/back.webp')`;
    }

    if (isStandby) cardEl.style.transform = 'rotate(90deg)';
    
    if (interactiveType === 'drag') {
        cardEl.addEventListener('mousedown', e => handlePressStart(e, cardEl, zoneId, slotIndex, slotColor));
        cardEl.addEventListener('touchstart', e => handlePressStart(e, cardEl, zoneId, slotIndex, slotColor), { passive: false });
    }
    
    if (zoneId === 'hand' || zoneId === 'stage' || zoneId === 'direction') {
         cardEl.addEventListener('click', e => handleTap(cardEl, { zoneId, slotIndex, slotColor, cardId: actualCardId }));
    }
    return cardEl;
}

export function handlePressStart(e, element, zoneId, slotIndex, slotColor) {
    e.preventDefault();
    let isDragging = false;
    let draggedCardVisual = null;
    let draggedCardData = null;        let sourceInfo = { zoneId, slotIndex, slotColor };
    let isPile = (element.classList.contains('pile-zone'));

    if (isPile) {
        zoneId = element.dataset.zoneId;
        sourceInfo.zoneId = zoneId;
        if (gameState.zones[zoneId].length === 0) return;
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
        sourceInfo.zoneId = 'trash';
    } else if (zoneId === 'deck-expanded') {
        draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
        sourceInfo.zoneId = 'deck';
    } else if (zoneId === 'volnoise-expanded') {
        draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
        sourceInfo.zoneId = 'volNoise';
    } else if (zoneId === 'temporary-expanded') {
        draggedCardData = { cardId: element.dataset.cardId, isStandby: false };
        sourceInfo.zoneId = 'temporary'; 
    }
    if (!draggedCardData && !isPile) {
         return;
    }

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

    let longPressActionCompleted = false;

    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        if (!isDragging && element.classList.contains('card') && !isPile) {
            const cardIdToZoom = element.dataset.cardId;
            if (cardIdToZoom && elements.cardZoomOverlay && elements.zoomedCardImage) {
                elements.zoomedCardImage.style.backgroundImage = `url('${CARD_IMAGE_PATH}${cardIdToZoom}.webp')`;
                elements.cardZoomOverlay.style.display = 'flex';
                longPressActionCompleted = true;
            }
        }
        longPressTimer = null;
    }, LONG_PRESS_DELAY);

    const onMove = (moveEvent) => {
        const moveX = (moveEvent.touches ? moveEvent.touches[0] : moveEvent).clientX;
        const moveY = (moveEvent.touches ? moveEvent.touches[0] : moveEvent).clientY;
        if (Math.abs(moveX - startX) > 5 || Math.abs(moveY - startY) > 5) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (elements.cardZoomOverlay.style.display === 'flex') {
                elements.cardZoomOverlay.style.display = 'none';
            }

            if (!isDragging) {
                isDragging = true;
                if (!isPile && element) element.style.opacity = '0.5';
                if (draggedCardData) {
                    draggedCardVisual = document.createElement('div');
                    draggedCardVisual.className = 'card dragging';
                    
                    if (isPile && sourceInfo.zoneId === 'deck') {
                        draggedCardVisual.style.backgroundImage = `url('./items/back.webp')`;
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
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        if (elements.cardZoomOverlay.style.display === 'flex') {
            elements.cardZoomOverlay.style.display = 'none';
        }

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
        if (!isPile && element) element.style.opacity = '1';
          if (isDragging) {
            if (draggedCardData) {
                const endX = (endEvent.changedTouches ? endEvent.changedTouches[0] : endEvent).clientX;
                const endY = (endEvent.changedTouches ? endEvent.changedTouches[0] : endEvent).clientY;
                const targetEl = document.elementFromPoint(endX, endY);
                let dropped = false;
                const targetSlot = targetEl ? targetEl.closest('.card-slot.drop-zone') : null;
                const targetNonSlotZone = targetEl ? targetEl.closest('.zone.drop-zone:not(#stage-zone):not(#direction-zone):not(#temporary-expanded-zone), .temporary-zone-card-area.drop-zone') : null;
                const targetExpandedTrash = targetEl ? targetEl.closest('#trash-expanded-zone') : null;
                const targetTemporaryZone = targetEl ? (targetEl.closest('#temporary-expanded-zone') || targetEl.closest('.temporary-zone-card-area')) : null;
                removeCardFromState(draggedCardData, sourceInfo);

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
                } else if (targetExpandedTrash && elements.trashExpandedZone.style.display === 'flex') {
                    if (addCardToState(draggedCardData, { zoneId: 'trash' })) {
                        dropped = true;
                    }
                } else if (targetTemporaryZone && elements.temporaryExpandedZone.style.display === 'flex') {
                    if (addCardToState(draggedCardData, { zoneId: 'temporary' })) {
                        dropped = true;
                    }
                }
                
                if (!dropped) {
                    addCardToState(draggedCardData, sourceInfo); 
                }
            }
            if (draggedCardVisual) draggedCardVisual.style.display = 'none';
        } else {
            if (!longPressActionCompleted) {
                if (isPile) {
                    handleTap(element, { zoneId: sourceInfo.zoneId });
                } else {
                    handleTap(element, sourceInfo);
                }
            }
        }
        try {
            if (draggedCardVisual) {
                draggedCardVisual.remove();
                draggedCardVisual = null;
            }
        } catch (error) {
            console.warn('[onEnd] Error removing drag visual:', error);
            draggedCardVisual = null;
        }
        
        document.querySelectorAll('.card.dragging').forEach(el => {
            try {
                el.remove();
            } catch (error) {
                console.warn('[onEnd] Error removing orphaned drag visual:', error);
            }
        });
        
        isDragging = false;
        draggedCardData = null;
        
        renderAll();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

export function handleTap(element, tapInfo) {
    const currentTime = performance.now();
    const { zoneId, slotIndex, slotColor } = tapInfo;
    const cardId = element.classList.contains('card') ? element.dataset.cardId : null;

    if (element.classList.contains('pile-zone') && zoneId === 'trash') {
        if (elements.trashExpandedZone.style.display === 'flex') {
            elements.trashExpandedZone.style.display = 'none';
        } else {
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
            elements.trashExpandedZone.style.display = 'flex';
        }
        renderAll();
        return;
    }
    if (element.classList.contains('pile-zone')) {
        if (zoneId === 'deck' && gameState.zones.deck.length > 0) {
            if (elements.temporaryExpandedZone.style.display === 'flex') {
                const topCard = gameState.zones.deck.pop();
                if (topCard) {
                    gameState.zones.temporary.push(topCard);
                }
            } else {
                gameState.zones.hand.push(gameState.zones.deck.pop());
            }
        } else if (zoneId === 'volNoise' && gameState.zones.volNoise && gameState.zones.volNoise.length > 0) {
            const topCard = gameState.zones.volNoise.pop();
            if (topCard) {
                gameState.zones.hand.push(topCard);
            }
        }
        lastTapTime = 0;
        lastTapTargetCardId = null;
    } else if (cardId) {
        if (currentTime - lastTapTime <= DOUBLE_TAP_THRESHOLD && lastTapTargetCardId === cardId) {
            lastTapTime = 0;
        } else {
            lastTapTime = currentTime;
            lastTapTargetCardId = cardId;
            if (zoneId === 'direction' || zoneId === 'stage') {
                let slotArray;
                if (zoneId === 'direction') slotArray = gameState.zones.direction[slotIndex];
                else if (zoneId === 'stage') slotArray = gameState.zones.stage[slotIndex][slotColor];
                
                if (slotArray && slotArray.length > 0) {
                    const topCard = slotArray[slotArray.length - 1];
                    if (cardId === topCard.cardId) {
                        topCard.isStandby = !topCard.isStandby;
                    }
                }
            }
        }
    }
    renderAll();
}

export function saveDeckDataToCookie() {
    const singleDeck = elements.deckString.value.trim();
    const dualDeckP1 = elements.deckStringP1.value.trim();
    const dualDeckP2 = elements.deckStringP2.value.trim();
    
    setCookie('deck-single', singleDeck, 30);
    setCookie('deck-p1', dualDeckP1, 30);
    setCookie('deck-p2', dualDeckP2, 30);
}

export function loadDeckDataFromCookie() {
    const savedSingleDeck = getCookie('deck-single');
    const savedDeckP1 = getCookie('deck-p1');
    const savedDeckP2 = getCookie('deck-p2');
    
    if (savedSingleDeck) {
        elements.deckString.value = savedSingleDeck;
    }
    
    if (savedDeckP1) {
        elements.deckStringP1.value = savedDeckP1;
    }
    
    if (savedDeckP2) {
        elements.deckStringP2.value = savedDeckP2;
    }
}

export function clearDeckData(deckType) {
    switch (deckType) {
        case 'single':
            elements.deckString.value = '';
            setCookie('deck-single', '', 30);
            break;
        case 'p1':
            elements.deckStringP1.value = '';
            setCookie('deck-p1', '', 30);
            break;
        case 'p2':
            elements.deckStringP2.value = '';
            setCookie('deck-p2', '', 30);
            break;
    }
}

export function loadBackgroundFromCookie() {
    const savedBackground = getCookie('playmat-background');
    
    if (savedBackground) {
        if (savedBackground === 'none') {
            document.body.style.backgroundImage = '';
        } else {
            setBackgroundWithCheck(savedBackground);
        }
    }
}

export function changeBackground() {
    const currentBg = document.body.style.backgroundImage;
    
    if (!currentBg || currentBg === '' || currentBg === 'none') {
        setBackgroundWithCheck('items/wall.webp');
        setCookie('playmat-background', 'items/wall.webp');
    } else if (currentBg.includes('wall.webp') && !currentBg.includes('wall1.webp') && !currentBg.includes('wall2.webp')) {
        setBackgroundWithCheck('items/wall1.webp');
        setCookie('playmat-background', 'items/wall1.webp');
    } else if (currentBg.includes('wall1.webp')) {
        setBackgroundWithCheck('items/wall2.webp');
        setCookie('playmat-background', 'items/wall2.webp');
    } else if (currentBg.includes('wall2.webp')) {
        document.body.style.backgroundImage = '';
        setCookie('playmat-background', 'none');
    } else {
        document.body.style.backgroundImage = '';
        setCookie('playmat-background', 'none');
    }
}

export function setBackgroundWithCheck(imagePath) {
    const img = new Image();
    img.onload = function() {
        document.body.style.backgroundImage = `url('${imagePath}')`;
    };
    img.onerror = function() {
        console.warn(`Background image not found: ${imagePath}`);
        document.body.style.backgroundImage = '';
        setCookie('playmat-background', 'none');
    };
    img.src = imagePath;
}

export function showResetPopup() {
    const swapPlayersBtn = elements.resetSwapPlayers;
    if (gameState.isDualMode) {
        swapPlayersBtn.style.display = 'block';
    } else {
        swapPlayersBtn.style.display = 'none';
    }
    elements.resetPopupOverlay.style.display = 'flex';
}

export function hideResetPopup() {
    elements.resetPopupOverlay.style.display = 'none';
}

export function updateOpponentPreview() {
    if (!gameState.isDualMode) {
        elements.viewOpponentBtn.style.display = 'none';
        elements.switchPlayerBtn.style.display = 'none';
        return;
    }
    elements.viewOpponentBtn.style.display = 'block';
    elements.switchPlayerBtn.style.display = 'block';
}

export function showOpponentFullscreen() {
    if (!gameState.isDualMode) return;
    
    const opponentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    const opponent = gameState.players[opponentPlayer];
    
    if (!opponent) return;
    
    elements.opponentFullscreen.style.display = 'flex';
    elements.opponentFullscreenBoard.innerHTML = `
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
                                <div class="opponent-card-slots">
                                    ${['green', 'blue', 'red'].map(color => {
                                        const cards = opponent.zones.stage[i][color] || [];
                                        return `<div class="opponent-card-slot opponent-${color}-slot">
                                            ${cards.map((card, cardIndex) => {
                                                let transformValue;
                                                if (color === 'green') {
                                                    const yOffset = (cards.length - 1 - cardIndex) * 12;
                                                    transformValue = `translate(${cardIndex * 2}px, ${yOffset}px)`;
                                                } else if (color === 'red') {
                                                    const yOffset = cardIndex * 15;
                                                    transformValue = `translate(${cardIndex * 2}px, ${yOffset}px)`;
                                                } else {
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
                            return `
                                <div class="opponent-direction-slot">
                                    ${directionCards.map((card, cardIndex) => `
                                        <div class="opponent-card ${card.isStandby ? 'standby' : ''}"
                                             style="z-index: ${cardIndex + 1}; 
                                                    transform: translate(${cardIndex * 8}px, ${cardIndex * 6}px);
                                                    background-image: url('${CARD_IMAGE_PATH}${card.cardId}.webp');
                                                    background-size: 180%;
                                                    background-position: center 40%;">
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }).join('')}
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
            <div class="opponent-hand-cards">
                ${opponent.zones.hand.map(cardId => `
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

export function hideOpponentFullscreen() {
    elements.opponentFullscreen.style.display = 'none';
}

export function updateMobileFullscreenButton() {
    const isGameVisible = elements.gameBoard && 
                         elements.gameBoard.style.display === 'flex' && 
                         elements.deckInputScreen && 
                         elements.deckInputScreen.style.display === 'none';
    
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const isMobile = window.innerWidth <= 768 || (window.innerWidth <= 932 && window.innerHeight <= window.innerWidth);
    
    if (elements.fullscreenMobileBtn) {
        if (isGameVisible && !isFullscreen && isMobile) {
            elements.fullscreenMobileBtn.style.display = 'block';
        } else {
            elements.fullscreenMobileBtn.style.display = 'none';
        }
    }
}

export function updateTemporaryButtonState() {
    if (elements.openTemporaryZoneBtn) {
        const tempCount = gameState.zones.temporary.length;
        if (tempCount > 0) {
            elements.openTemporaryZoneBtn.textContent = `テンポラリー (${tempCount})`;
            elements.openTemporaryZoneBtn.classList.add('has-cards');
        } else {
            elements.openTemporaryZoneBtn.textContent = 'テンポラリー';
            elements.openTemporaryZoneBtn.classList.remove('has-cards');
        }
    }
}

export function clearEventListeners() {
    // カウンターボタンのイベントリスナーをクリア
    elements.counterBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // チェンジボタンのイベントリスナーをクリア
    elements.changeStageBtns.forEach(btn => {
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
    const zoneElements = [elements.trashZone, elements.deckZone, elements.volNoiseZone];
    zoneElements.forEach(element => {
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        }
    });
}

export function setupEventListeners() {
    elements.mulliganBtn.addEventListener('click', () => { mulliganHand(); renderAll(); });
    elements.moveHandToTrashBtn.addEventListener('click', () => { moveHandToTrash(); renderAll(); });
    elements.sortHandBtn.addEventListener('click', () => { sortHand(); renderAll(); });
    
    elements.trashZone.addEventListener('mousedown', e => handlePressStart(e, elements.trashZone, 'trash'));
    elements.trashZone.addEventListener('touchstart', e => handlePressStart(e, elements.trashZone, 'trash'), { passive: false });

    elements.deckZone.addEventListener('mousedown', e => handlePressStart(e, elements.deckZone, 'deck'));
    elements.deckZone.addEventListener('touchstart', e => handlePressStart(e, elements.deckZone, 'deck'), { passive: false });

    elements.volNoiseZone.addEventListener('mousedown', e => handlePressStart(e, elements.volNoiseZone, 'volNoise'));
    elements.volNoiseZone.addEventListener('touchstart', e => handlePressStart(e, elements.volNoiseZone, 'volNoise'), { passive: false });

    elements.counterBtns.forEach(btn => btn.addEventListener('click', () => {
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

    elements.shuffleBtn.addEventListener('click', () => {
        shuffle(gameState.zones.deck);
        displayShuffleMessage();
        renderAll();
    });

    elements.searchDeckBtn.addEventListener('click', () => {
        if (elements.deckExpandedZone.style.display === 'flex') {
            elements.deckExpandedZone.style.display = 'none';
            shuffle(gameState.zones.deck);
            displayShuffleMessage();
            renderAll();
        } else {
            elements.deckExpandedZone.style.display = 'flex';
            renderAll();
        }
    });

    elements.searchVolnoiseBtn.addEventListener('click', () => {
        if (elements.volnoiseExpandedZone.style.display === 'flex') {
            elements.volnoiseExpandedZone.style.display = 'none';
        } else {
            elements.volnoiseExpandedZone.style.display = 'flex';
        }
        renderAll();
    });
    
    elements.openTemporaryZoneBtn.addEventListener('click', () => {
        if ( elements.temporaryExpandedZone.style.display === 'flex') {
            elements.temporaryExpandedZone.style.display = 'none';
            updateTemporaryButtonState();
        } else {
            elements.temporaryExpandedZone.style.display = 'flex';
        }
        renderAll();
    });

    elements.tempToTrashBtn.addEventListener('click', () => {
        if (gameState.zones.temporary.length > 0) {
            gameState.zones.trash.push(...gameState.zones.temporary);
            gameState.zones.temporary = [];
            renderAll();
            elements.temporaryExpandedZone.style.display = 'none';
        }
    });

    elements.tempToDeckShuffleBtn.addEventListener('click', () => {
        if (gameState.zones.temporary.length > 0) {
            gameState.zones.deck.push(...gameState.zones.temporary);
            gameState.zones.temporary = [];
            shuffle(gameState.zones.deck);
            displayShuffleMessage();
            renderAll();
            elements.temporaryExpandedZone.style.display = 'none';
        }
    });
    
    elements.tempToDeckBottomBtn.addEventListener('click', () => {
        if (gameState.zones.temporary.length > 0) {
            shuffle(gameState.zones.temporary);
            gameState.zones.deck.unshift(...gameState.zones.temporary);
            gameState.zones.temporary = [];
            renderAll();
        }
    });

    elements.tempHandToTemporaryBtn.addEventListener('click', () => {
        if (gameState.zones.hand.length > 0) {
           
            gameState.zones.temporary.push(...gameState.zones.hand);
            gameState.zones.hand = [];
            renderAll();
        }
    });
    
    elements.switchPlayerBtn.addEventListener('click', () => {
        switchPlayerOnly();
        updateOpponentPreview();
        renderAll();
    });

    elements.turnEndBtn.addEventListener('click', () => {
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
        gameState.zones.direction.forEach(slotArray => {
            if (slotArray) {
                slotArray.forEach(card => {
                    if (card.isStandby) {
                        card.isStandby = false;
                    }
                });
            }
        });
        
        displayTurnEndMessage();
        
        if (gameState.isDualMode) {
            setTimeout(() => {
                switchPlayer();
                if (gameState.zones.deck.length > 0) {
                    const drawnCard = gameState.zones.deck.pop();
                    gameState.zones.hand.push(drawnCard);
                }
                updateOpponentPreview();
                renderAll();
            }, 1000);
        } else {
            gameState.counters.turn++;
            if (gameState.zones.deck.length > 0) {
                const drawnCard = gameState.zones.deck.pop();
                gameState.zones.hand.push(drawnCard);
            }
            renderAll();
        }
    });
    
    elements.resetBtn.addEventListener('click', () => {
        showResetPopup();
    });

    elements.changeMatBtn.addEventListener('click', changeBackground);

    elements.drawBottomDeckBtn.addEventListener('click', () => {
        if (gameState.zones.deck.length > 0) {
            const bottomCard = gameState.zones.deck.shift();
            if (bottomCard) {
                if (elements.temporaryExpandedZone.style.display === 'flex') {
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

    elements.rollDiceBtn.addEventListener('click', () => {
        const diceResultEl = document.createElement('div');
        diceResultEl.className = 'dice-result';

        const roll = Math.floor(Math.random() * 6) + 1;
        diceResultEl.style.backgroundImage = `url('items/dice${roll}.webp')`;
        diceResultEl.style.display = 'flex';
        elements.diceContainer.appendChild(diceResultEl);

        setTimeout(() => {
            diceResultEl.style.opacity = '0';
            setTimeout(() => {
                diceResultEl.remove();
            }, 1000);
        }, 1500);
    });

    elements.changeStageBtns.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const button = event.target;
            const columnIndex = parseInt(button.dataset.columnIndex, 10);

            const indexInSelected = selectedChangeColumns.indexOf(columnIndex);

            if (indexInSelected > -1) {
                selectedChangeColumns.splice(indexInSelected, 1);
                button.classList.remove('selected');
            } else {
                if (selectedChangeColumns.length < 2) {
                    selectedChangeColumns.push(columnIndex);
                    button.classList.add('selected');

                    if (selectedChangeColumns.length === 2) {
                        swapStageColumns(selectedChangeColumns[0], selectedChangeColumns[1]);
                        document.querySelectorAll('.change-stage-btn.selected').forEach(b => b.classList.remove('selected'));
                        selectedChangeColumns = [];
                        renderAll();
                    }
                }
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (elements.trashExpandedZone.style.display === 'flex') {
            if (elements.trashZone.contains(event.target)) {
                return;
            }
            if (elements.trashExpandedZone.contains(event.target)) {
                return;
            }
            elements.trashExpandedZone.style.display = 'none';
        }

        if (elements.deckExpandedZone.style.display === 'flex') {
            if (elements.searchDeckBtn.contains(event.target)) {
                return;
            }
            if (elements.deckExpandedZone.contains(event.target)) {
                return;
            }
            elements.deckExpandedZone.style.display = 'none';
            shuffle(gameState.zones.deck);
            displayShuffleMessage();
            renderAll();
        }

        if (elements.volnoiseExpandedZone.style.display === 'flex') {
            if (elements.searchVolnoiseBtn.contains(event.target)) {
                return;
            }
            if (elements.volnoiseExpandedZone.contains(event.target)) {
                return;
            }
            elements.volnoiseExpandedZone.style.display = 'none';
        }

        if (elements.temporaryExpandedZone.style.display === 'flex') {
            if (elements.openTemporaryZoneBtn.contains(event.target) || elements.temporaryExpandedZone.contains(event.target)) {
                return;
            }
            elements.temporaryExpandedZone.style.display = 'none';
        }
    });

    elements.resetToDeckSelect.addEventListener('click', () => {
        hideResetPopup();
        showDeckInputScreen();
        loadDeckDataFromCookie();
        updateMobileFullscreenButton();
    });
    
    elements.resetSameDeck.addEventListener('click', () => {
        hideResetPopup();
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
            
            initGameState(currentDeck1, true, currentDeck2);
        } else {
            const currentDeck = gameState.initialDeckOrder.slice();
            initGameState(currentDeck, false);
        }
        renderAll();
    });
    
    elements.resetCancel.addEventListener('click', () => {
        hideResetPopup();
    });

    elements.resetSwapPlayers.addEventListener('click', () => {
        hideResetPopup();
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
            
            initGameState(currentDeck2, true, currentDeck1);
            renderAll();
        }
    });

    elements.resetPopupOverlay.addEventListener('click', (event) => {
        if (event.target === elements.resetPopupOverlay) {
            hideResetPopup();
        }
    });
    
    elements.viewOpponentBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        showOpponentFullscreen();
    });
    
    elements.viewOpponentBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showOpponentFullscreen();
    });
    
    elements.viewOpponentBtn.addEventListener('mouseup', () => {
        hideOpponentFullscreen();
    });
    
    elements.viewOpponentBtn.addEventListener('mouseleave', () => {
        hideOpponentFullscreen();
    });
    
    elements.viewOpponentBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        hideOpponentFullscreen();
    });
    
    elements.viewOpponentBtn.addEventListener('touchcancel', () => {
        hideOpponentFullscreen();
    });
    
    elements.opponentFullscreen.addEventListener('click', () => {
        hideOpponentFullscreen();
    });

    elements.singleDeckModeBtn.addEventListener('click', () => {
        elements.singleDeckModeBtn.classList.add('active');
        elements.dualDeckModeBtn.classList.remove('active');
        elements.singleDeckInput.style.display = 'block';
        elements.dualDeckInput.style.display = 'none';
    });
    
    elements.dualDeckModeBtn.addEventListener('click', () => {
        elements.dualDeckModeBtn.classList.add('active');
        elements.singleDeckModeBtn.classList.remove('active');
        elements.singleDeckInput.style.display = 'none';
        elements.dualDeckInput.style.display = 'block';
    });

    elements.deckString.addEventListener('input', saveDeckDataToCookie);
    elements.deckStringP1.addEventListener('input', saveDeckDataToCookie);
    elements.deckStringP2.addEventListener('input', saveDeckDataToCookie);

    elements.clearDeckBtn.addEventListener('click', () => { clearDeckData('single'); });
    elements.clearDeckP1Btn.addEventListener('click', () => { clearDeckData('p1'); });
    elements.clearDeckP2Btn.addEventListener('click', () => { clearDeckData('p2'); });
    
    elements.startGameBtn.addEventListener('click', () => {
        const isDualMode = elements.dualDeckModeBtn.classList.contains('active');
        
        if (isDualMode) {
            let deckString1 = elements.deckStringP1.value.trim();
            let deckList1;
            if (!deckString1) {
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
                deckList1 = deckString1.split('/').filter(id => id.trim() !== '');
            }

            let deckString2 = elements.deckStringP2.value.trim();
            let deckList2;
            if (!deckString2) {
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
                deckList2 = deckString2.split('/').filter(id => id.trim() !== '');
            }
            
            if (deckList1.length === 0 || deckList2.length === 0) {
                alert('両方のプレイヤーのデッキリストを入力してください。');
                return;
            }
            initGameState(deckList1, true, deckList2);
        } else {
            let deckString = elements.deckString.value.trim();
            let deckList;

            if (!deckString) {
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
                deckList = deckString.split('/').filter(id => id.trim() !== '');
            }

            if (deckList.length === 0) {
                alert('有効なデッキリストを入力してください。');
                return;
            }
            initGameState(deckList, false);
        }
        showGameScreen();
        clearEventListeners();
        setupEventListeners();
        renderAll();
        updateOpponentPreview();
        setTimeout(updateMobileFullscreenButton, 100);
    });

    elements.fullscreenBtn.addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    });

    elements.fullscreenMobileBtn.addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    window.addEventListener('resize', updateMobileFullscreenButton);
}

export function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    
    if (isFullscreen) {
        document.body.classList.add('fullscreen-mode');
    } else {
        document.body.classList.remove('fullscreen-mode');
    }
    updateMobileFullscreenButton();
}
