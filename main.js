// main.js
import { setupPasswordAuthentication, checkAuthentication } from './utils/auth.js';
import { loadBackgroundFromCookie, loadDeckDataFromCookie } from './ui/eventHandlers.js';
import { initGameState } from './game/gameState.js';
import { renderAll } from './ui/eventHandlers.js';

document.addEventListener('DOMContentLoaded', () => {
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
    renderAll();
});
