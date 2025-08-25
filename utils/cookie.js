// utils/cookie.js

export function setCookie(name, value, days = 30) {
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

export function getCookie(name) {
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
