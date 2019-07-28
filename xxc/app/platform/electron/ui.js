import {
    shell,
    remote as Remote,
} from 'electron';
import uuid from 'uuid/v4';
import Path from 'path';
import EVENT from './remote-events';
import {
    onRequestQuit as onMainRequestQuit, callRemote, ipcSend, onRequestOpenUrl
} from './remote';
import shortcut from './shortcut';
import env from './env';
import getUrlMeta from './get-url-meta';

/**
 * 当前窗口名称
 * @type {string}
 */
export const browserWindowName = env.windowName;

/**
 * 获取当前窗口是否为第一个打开的主窗口
 * @return {boolean} 如果为 true，则表示当前窗口是主窗口
 */
export const isMainWindow = () => browserWindowName === 'main';

/**
 * 用户数据目录
 * @type {string}
 */
export const userDataPath = Remote.app.getPath('userData');

/**
 * 当前应用窗口实例
 * @type {BrowserWindow}
 */
export const browserWindow = Remote.getCurrentWindow();

/**
 * 处理请求退出回调函数
 * @type {function}
 * @private
 */
let onRequestQuitListener = null;

/**
 * 创建用户个人目录
 * @param {{identify: string}|User} user 用户对象
 * @param {string} fileName 文件名称
 * @param {string} [dirName=images] 目录名称
 * @return {string} 用户个人目录
 */
export const createUserDataPath = (user, fileName, dirName = 'images') => {
    return Path.join(userDataPath, 'users', user.identify, dirName, fileName);
};

/**
 * 创建临时文件
 * @param {string} ext 文件扩展名
 * @return {string} 临时文件保存路径
 */
export const makeTmpFilePath = (ext = '') => {
    return Path.join(userDataPath, `tmp/${uuid()}${ext}`);
};

/**
 * 设置 Mac Dock 栏应用图标上的原点提示文本
 *
 * @param {string} label 提示文本
 * @memberof AppRemote
 * @return {void}
 */
export const setBadgeLabel = (label = '') => {
    return callRemote('dockBadgeLabel', `${label || ''}`, browserWindowName);
};

/**
 * 设置当前窗口是否在任务栏显示
 * @param {boolean} flag 是否在任务栏显示
 * @return {void}
 */
export const setShowInTaskbar = flag => {
    return browserWindow.setSkipTaskbar(!flag);
};

/**
 * 设置工具栏图标上的工具提示文本
 * @param {string} tooltip 工具提示文本
 * @return {void}
 */
export const setTrayTooltip = tooltip => {
    return callRemote('trayTooltip', tooltip, browserWindowName);
};

/**
 * 设置是否闪烁通知栏图标
 * @param {boolean} [flash=true] 是否闪烁通知栏图标
 * @return {void}
 */
export const flashTrayIcon = (flash = true) => {
    return callRemote('flashTrayIcon', flash, browserWindowName);
};

/**
 * 显示应用窗口
 * @return {void}
 */
export const showWindow = () => {
    browserWindow.show();
};

/**
 * 隐藏应用窗口
 * @return {void}
 */
export const hideWindow = () => {
    browserWindow.minimize();
};

/**
 * 激活应用窗口
 * @return {void}
 */
export const focusWindow = () => {
    browserWindow.focus();
};

/**
 * 关闭应用窗口
 * @return {void}
 */
export const closeWindow = () => {
    browserWindow.close();
};

/**
 * 显示并隐藏应用窗口
 * @return {void}
 */
export const showAndFocusWindow = () => {
    if (browserWindow.isMinimized()) {
        browserWindow.restore();
    } else {
        showWindow();
    }
    focusWindow();
};

/**
 * 请求立即退出应用程序
 * @return {void}
 */
export const quitIM = () => {
    callRemote('closeWindow', browserWindowName);
};

/**
 * 请求退出应用程序
 * @param {number} [delay=1000] 给定退出的宽限时间，单位毫秒
 * @param {boolean} [ignoreListener=false] 是否忽略监听事件（忽略询问用户建议）
 * @return {void}
 */
export const quit = (delay = 1000, ignoreListener = false) => {
    if (delay !== true && !ignoreListener && onRequestQuitListener) {
        if (onRequestQuitListener(delay) === false) {
            return;
        }
    }

    browserWindow.hide();
    shortcut.unregisterAll();

    if (delay && delay !== true) {
        setTimeout(quitIM, delay);
    } else {
        quitIM();
    }
};

/**
 * 绑定请求退出事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onRequestQuit = listener => {
    onRequestQuitListener = listener;
};

/**
 * 绑定监听应用窗口获得焦点事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onWindowFocus = listener => {
    browserWindow.on('focus', listener);
};

/**
 * 绑定监听应用窗口失去焦点事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onWindowBlur = listener => {
    browserWindow.on('blur', listener);
};

/**
 * 绑定监听应用窗口最小化事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onWindowMinimize = listener => {
    browserWindow.on('minimize', listener);
};

/**
 * 显示用户点击关闭按钮之前询问用户建议对话框
 * @param {function} callback 回调函数
 * @return {void}
 */
export const showQuitConfirmDialog = (message, rememberText, buttons, callback) => {
    Remote.dialog.showMessageBox(browserWindow, {
        type: 'question',
        message,
        checkboxLabel: callback ? rememberText : undefined,
        checkboxChecked: false,
        cancelId: 2,
        defaultId: 0,
        buttons,
    }, (result, checked) => {
        result = ['minimize', 'close', ''][result];
        if (callback) {
            result = callback(result, checked);
        }
        if (result === 'minimize') {
            hideWindow();
        } else if (result === 'close') {
            quit(true);
        }
    });
};

/**
 * 打开开发者工具
 * @return {void}
 */
export const openDevTools = () => {
    browserWindow.webContents.openDevTools({mode: 'bottom'});
    // todo: Turn on debug mode
};

/**
 * 重新加载窗口
 * @return {void}
 */
export const reloadWindow = () => {
    browserWindow.reload();
};

/**
 * 判断是否在操作系统登录后启动应用
 * @returns {boolean} 如果返回 `true` 则为是在操作系统登录后启动应用，否则为不是
 */
export const isOpenAtLogin = () => {
    return Remote.app.getLoginItemSettings().openAtLogin;
};

/**
 * 设置是否在操作系统登录后启动应用
 * @param {boolean} openAtLogin 是否在操作系统登录后启动应用
 * @return {void}
 */
export const setOpenAtLogin = openAtLogin => {
    Remote.app.setLoginItemSettings({openAtLogin});
    // Fix disable openAtLogin not work in mac os, see https://github.com/electron/electron/issues/10880#issuecomment-356067655
    if (!openAtLogin && env.isOSX) {
        // eslint-disable-next-line no-undef
        __non_webpack_require__('child_process').exec(`osascript -e 'tell application "System Events" to delete login item "${Remote.app.getName()}"'`);
    }
};

/**
 * 复制在界面上选中的文本
 * @return {void}
 */
export const copySelectText = () => {
    browserWindow.webContents.copy();
};

/**
 * 选择界面上所有文本
 * @return {void}
 */
export const selectAllText = () => {
    browserWindow.webContents.selectAll();
};

/**
 * 绑定监听应用窗口还原事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onWindowRestore = listener => {
    browserWindow.on('restore', listener);
};

/**
 * 判断应用窗口是否获得焦点
 * @returns {boolean} 如果返回 `true` 则为是获得焦点，否则为不是获得焦点
 */
export const isWindowFocus = () => browserWindow.isFocused();

/**
 * 判断应用窗口是否处于打开状态
 * @returns {boolean} 如果返回 `true` 则为是处于打开状态，否则为不是处于打开状态
 */
export const isWindowOpen = () => !browserWindow.isMinimized() && browserWindow.isVisible();

/**
 * 判断应用窗口是否处于打开且获得焦点状态
 * @returns {boolean} 如果返回 `true` 则为是处于打开且获得焦点状态，否则为不是处于打开且获得焦点状态
 */
export const isWindowOpenAndFocus = () => browserWindow.isFocused() && !browserWindow.isMinimized() && browserWindow.isVisible();

/**
 * 获取应用根目录路径
 * @return {string} 根目录路径
 */
export const getAppRoot = () => env.appRoot;

/**
 * 创建一个新的应用窗口
 * @return {void}
 */
export const createAppWindow = () => {
    callRemote('createAppWindow');
};

export const setWindowTitle = title => {
    browserWindow.setTitle(title);
};

/**
 * 初始化
 * @param {Object} config 运行时配置
 * @return {void}
 */
const init = (config) => {
    // 监听主进程请求退出事件
    onMainRequestQuit((sender, closeReason) => {
        quit(closeReason);
    });

    // 监听应用窗口还原事件
    browserWindow.on('restore', () => {
        setShowInTaskbar(true);
    });

    // 向主进程发送应用窗口界面准备就绪事件
    ipcSend(EVENT.app_ready, config, browserWindowName);
};


export default {
    init,
    setWindowTitle,
    createAppWindow,
    userDataPath,
    browserWindowName,
    isMainWindow,
    browserWindow,
    makeTmpFilePath,
    openExternal: shell.openExternal,
    showItemInFolder: shell.showItemInFolder,
    openFileItem: shell.openItem,
    setBadgeLabel,
    setShowInTaskbar,
    onWindowMinimize,
    setTrayTooltip,
    flashTrayIcon,
    onRequestQuit,
    onRequestOpenUrl,
    onWindowFocus,
    closeWindow,
    openDevTools,
    onWindowBlur,
    onWindowRestore,

    showWindow,
    hideWindow,
    focusWindow,
    showAndFocusWindow,
    showQuitConfirmDialog,
    quit,
    reloadWindow,
    isOpenAtLogin,
    setOpenAtLogin,
    getUrlMeta,
    createUserDataPath,
    copySelectText,
    selectAllText,

    get isWindowFocus() {
        return isWindowFocus();
    },

    get isWindowOpen() {
        return isWindowOpen();
    },

    get isWindowOpenAndFocus() {
        return isWindowOpenAndFocus();
    },

    get appRoot() {
        return getAppRoot();
    },
};
