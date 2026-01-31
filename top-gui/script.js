const translations = {
    ja: {
        title: 'LINE Sticker Tools',
        subtitle: 'スタンプ作成を効率化するための専用ツールセット',
        removeBgTitle: 'Remove BG GUI',
        removeBgDesc: '画像の背景を簡単に除去・調整できます。',
        divideCropTitle: 'Divide & Crop GUI',
        divideCropDesc: '画像を自動で分割・切り抜きします。',
        arrangeTitle: 'Arrange GUI',
        arrangeDesc: 'スタンプの並び替えとパッケージングを行います。',
        openTool: 'Open Tool →',
        langEn: 'English',
        langJa: '日本語'
    },
    en: {
        title: 'LINE Sticker Tools',
        subtitle: 'Specialized toolset for efficient sticker creation',
        removeBgTitle: 'Remove BG GUI',
        removeBgDesc: 'Easily remove and adjust image backgrounds.',
        divideCropTitle: 'Divide & Crop GUI',
        divideCropDesc: 'Automatically divide and crop images.',
        arrangeTitle: 'Arrange GUI',
        arrangeDesc: 'Reorder and package stickers.',
        openTool: 'Open Tool →',
        langEn: 'English',
        langJa: '日本語'
    }
};

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        this.applyTheme();
        this.setupListeners();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateButtonText();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
    }

    setupListeners() {
        // System theme change listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });

        // Button listener
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleTheme());
        }
    }

    updateButtonText() {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

class LanguageManager {
    constructor() {
        this.language = this.getInitialLanguage();
        this.applyLanguage();
        this.setupListeners();
    }

    getInitialLanguage() {
        if (localStorage.getItem('language')) {
            return localStorage.getItem('language');
        }
        const lang = navigator.language || navigator.userLanguage || 'en';
        return lang.startsWith('ja') ? 'ja' : 'en';
    }

    applyLanguage() {
        localStorage.setItem('language', this.language);
        document.documentElement.lang = this.language;
        this.updateContent();
        this.updateButtonText();
    }

    toggleLanguage() {
        this.language = this.language === 'en' ? 'ja' : 'en';
        this.applyLanguage();
    }

    updateContent() {
        const t = translations[this.language];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });
    }

    setupListeners() {
        const btn = document.getElementById('lang-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleLanguage());
        }
    }

    updateButtonText() {
        const btn = document.getElementById('lang-toggle');
        if (btn) {
            // Display the OTHER language (to switch to)
            // If current is 'en', show 'JA'. If current is 'ja', show 'EN'.
            btn.textContent = this.language === 'en' ? 'JA' : 'EN';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new LanguageManager();
});
