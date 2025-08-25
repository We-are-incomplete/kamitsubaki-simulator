// game/gameState.js
import { shuffle } from './gameLogic.js';

export let gameState = {};

export function initGameState(deckList = [], isDualMode = false, deckList2 = []) {
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

export function getCurrentPlayerCounters() {
    if (gameState.isDualMode) {
        return gameState.players[gameState.currentPlayer].counters;
    } else {
        // 一人モードの場合は、従来の gameState.counters を使用
        return gameState.counters || gameState.players[1].counters;
    }
}

export function switchPlayer() {
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
}

export function switchPlayerOnly() {
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
}
