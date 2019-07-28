import {getThemeExt, getThemeExts} from './exts';
import Store from '../utils/store';

/**
 * 当前主题本地存储键前缀
 * @type {string}
 * @private
 */
const STORE_KEY = 'EXTENSIONS::theme.current';

/**
 * 当前主题
 * @type {Theme}
 * @private
 */
let currentTheme;

/**
 * 获取当前使用的主题
 * @return {Theme} 当前使用的主题
 */
export const getCurrentTheme = () => {
    if (currentTheme === undefined) {
        const currentThemeSetting = Store.get(STORE_KEY);
        if (currentThemeSetting) {
            const themeExt = getThemeExt(currentThemeSetting.extension);
            if (themeExt) {
                currentTheme = themeExt.getTheme(currentThemeSetting.name);
            }
        }
        if (!currentTheme) {
            currentTheme = null;
        }
    }
    return currentTheme;
};

/**
 * 默认主题样式表文件路径
 * @type {string}
 * @private
 */
let theDefaultThemeStyle;

/**
 * 主题在界面上所使用的 `<link>` 元素
 * @type {HTMLLinkElement}
 * @private
 */
let themeLinkElement = null;

if (process.env.HOT) {
    themeLinkElement = document.querySelector('link[href^="blob:"]');
    theDefaultThemeStyle = themeLinkElement.href;
} else {
    themeLinkElement = document.getElementById('theme');
    theDefaultThemeStyle = themeLinkElement.href;
}

/**
 * 主题切换动画效果定时任务 ID
 * @type {number}
 * @private
 */
let changingThemeTimer = null;

/**
 * 应用主题
 * @param {string|Theme} theme 要应用的主题名称或者主题对象
 * @return {void}
 */
export const applyTheme = theme => {
    theme = theme || currentTheme;
    clearTimeout(changingThemeTimer);
    document.body.classList.add('theme-changing');
    if (!theme || theme === 'default') {
        if (themeLinkElement.href !== theDefaultThemeStyle) {
            themeLinkElement.href = theDefaultThemeStyle;
        }
        const appendLinkElement = document.getElementById('appendTheme');
        if (appendLinkElement) {
            appendLinkElement.remove();
        }
    } else {
        const {styleFile} = theme;
        if (!styleFile) {
            applyTheme('');
            return 'THEME_HAS_NO_CSS_FILE';
        }
        if (theme.isAppend) {
            if (themeLinkElement.href !== theDefaultThemeStyle) {
                themeLinkElement.href = theDefaultThemeStyle;
            }
            let appendLinkElement = document.getElementById('appendTheme');
            if (!appendLinkElement) {
                appendLinkElement = document.createElement('link');
                appendLinkElement.rel = 'stylesheet';
                appendLinkElement.href = styleFile;
                appendLinkElement.id = 'appendTheme';
                document.getElementsByTagName('head')[0].appendChild(appendLinkElement);
            } else {
                appendLinkElement.href = styleFile;
            }
        } else {
            themeLinkElement.href = styleFile;
            const appendLinkElement = document.getElementById('appendTheme');
            if (appendLinkElement) {
                appendLinkElement.remove();
            }
        }
    }
    document.body.setAttribute('data-theme', theme ? theme.id : null);

    changingThemeTimer = setTimeout(() => {
        document.body.classList.remove('theme-changing');
    }, 800);

    if (DEBUG) {
        console.collapse('Extension Apply Theme', 'greenBg', theme ? theme.displayName : (theme || 'default'), 'greenPale');
        console.log('theme', theme);
        console.groupEnd();
    }
};

/**
 * 设置当前所使用的主题
 * @param {string|Theme} theme 要应用的主题名称或者主题对象，`'default'` 为应用默认主题
 * @return {void}
 */
export const setCurrentTheme = theme => {
    if (theme === 'default') {
        theme = null;
    }
    currentTheme = theme;
    if (theme) {
        const currentThemeSetting = {
            extension: theme.extension.name,
            name: theme.name
        };
        Store.set(STORE_KEY, currentThemeSetting);
    } else {
        Store.remove(STORE_KEY);
    }
    return applyTheme(theme);
};

/**
 * 检查指定的主题编号是否是当前设置的主题
 * @param {string} themeId 主题编号
 * @returns {boolean} 如果返回 `true` 则为是当前设置的主题，否则为不是当前设置的主题
 */
export const isCurrentTheme = themeId => (themeId === 'default' && !currentTheme) || (currentTheme && currentTheme.id === themeId);

/**
 * 搜索主题
 * @param {string} keys 搜索字符串
 * @return {Theme[]} 搜索到的主题列表
 */
export const searchThemes = (keys) => {
    keys = keys.trim().toLowerCase().split(' ');
    const result = [];
    getThemeExts().forEach(theExt => {
        const extThemes = theExt.themes;
        if (extThemes.length) {
            const searchGroup = {
                name: theExt.name,
                displayName: theExt.displayName,
                icon: theExt.icon,
                accentColor: theExt.accentColor,
                score: 0,
            };
            const themes = [];
            extThemes.forEach(extTheme => {
                const themeScore = extTheme.getMatchScore(keys);
                if (themeScore) {
                    searchGroup.score += themeScore;
                    extTheme.matchScore = themeScore;
                    themes.push(extTheme);
                }
            });
            if (themes.length) {
                themes.sort((x, y) => y.matchScore - x.matchScore);
                searchGroup.themes = themes;
                if (searchGroup.score) {
                    result.push(searchGroup);
                }
            }
        }
    });
    result.sort((x, y) => y.score - x.score);
    return result;
};

/**
 * 初始化扩展主题
 * @return {void}
 */
export const initThemes = () => {
    // 获取当前设置的主题，如果有则应用主题
    if (getCurrentTheme()) {
        applyTheme();
    }
};

export default {
    get all() {
        return getThemeExts();
    },

    search: searchThemes,
    isCurrentTheme,
    getCurrentTheme,
    setCurrentTheme,
    applyTheme,
};
