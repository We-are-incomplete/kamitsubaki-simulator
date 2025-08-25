// utils/auth.js
import { CORRECT_PASSWORD_HASH, AUTH_COOKIE_NAME, AUTH_EXPIRY_DAYS } from '../constants.js';
import { setCookie, getCookie } from './cookie.js';

// パスワードをSHA-256でハッシュ化する関数
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 認証チェック
export function checkAuthentication() {
    const authCookie = getCookie(AUTH_COOKIE_NAME);
    const isAuthenticated = authCookie === 'authenticated';
    
    if (isAuthenticated) {
        showDeckInputScreen();
    } else {
        showPasswordScreen();
    }
}

// パスワード画面を表示
export function showPasswordScreen() {
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
export function showDeckInputScreen() {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('deck-input-screen').style.display = 'flex';
    document.getElementById('game-board').style.display = 'none';
}

// ゲーム画面を表示
export function showGameScreen() {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('deck-input-screen').style.display = 'none';
    document.getElementById('game-board').style.display = 'flex';
}

// パスワード認証処理
export async function authenticatePassword() {
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
export function setupPasswordAuthentication() {
    const passwordInput = document.getElementById('password-input');
    const passwordSubmitBtn = document.getElementById('password-submit-btn');
    
    // ボタンクリックで認証
    passwordSubmitBtn.addEventListener('click', authenticatePassword);
    
    // Enterキーで認証
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authenticatePassword();
        }
    });
}
