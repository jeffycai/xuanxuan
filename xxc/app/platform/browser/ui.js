/**
 * 打开外部链接，在浏览器平台上处理方式是通过打开新标签页实现
 * @param {string} link 要打开的链接
 * @return {void}
 */
export const openExternal = link => {
    window.open(link);
};

/**
 * 判断网页是否获得焦点
 * @private
 * @returns {boolean} 如果返回 `true` 则为获得焦点，否则为没有获得焦点
 */
const isDocumentHasFocus = () => {
    return window.document.hasFocus();
};

/**
 * 保存所有窗口激活回调函数
 * @private
 * @type {function[]}
 */
const windowFocusHandlers = [];

/**
 * 保存上次判断的窗口是否激活
 * @private
 * @type {boolean}
 */
let iwWindowHasFocus = isDocumentHasFocus();

/**
 * 检查窗口是否激活
 * @return {void}
 * @private
 */
const checkWindowHasFocus = () => {
    const isHasFocus = isDocumentHasFocus();
    if (isHasFocus !== iwWindowHasFocus) {
        if (isHasFocus) {
            windowFocusHandlers.forEach(x => x());
        }
    }
    iwWindowHasFocus = isHasFocus;
};

// 定期检查窗口激活状态
setInterval(checkWindowHasFocus, 300);

/**
 * 绑定应用窗口激活事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onWindowFocus = listener => {
    windowFocusHandlers.push(listener);
};

/**
 * 当前应用窗口是否打开
 * 在浏览器平台上此值永远返回 `true`
 * @type {boolean}
 */
export const isWindowOpen = true;

/**
 * 当前应用窗口是否打开并且激活
 * @returns {boolean} 如果返回 `true` 则为打开并且激活，否则为没有打开并且激活
 */
export const isWindowOpenAndFocus = isDocumentHasFocus;

/**
 * 当前应用窗口是否处于激活状态
 * @returns {boolean} 如果返回 `true` 则为处于激活状态，否则为没有处于激活状态
 */
export const isWindowFocus = isDocumentHasFocus;

export default {
    openExternal,
    get isWindowOpenAndFocus() {
        return isDocumentHasFocus();
    },
    get isWindowFocus() {
        return isDocumentHasFocus();
    },
    isWindowOpen,
    onWindowFocus,
};
