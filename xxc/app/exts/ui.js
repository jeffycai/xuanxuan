// eslint-disable-next-line import/no-unresolved
import Path from 'path';
import {getDefaultApp, getAppExt} from './exts';
import OpenedApp from './opened-app';
import Lang from '../core/lang';
import {
    setExtensionDisabled, openInstallExtensionDialog, uninstallExtension, saveExtensionData,
} from './manager';
import Modal from '../components/modal';
import Messager from '../components/messager';
import ExtensionDetailDialog from '../views/exts/extension-detail-dialog';
import platform from '../platform';

// 从平台功能访问对象获取功能模块对象
const {clipboard, ui: platformUI} = platform.modules;

/**
 * 默认打开的应用
 * @type {OpenedApp}
 * @private
 */
let defaultOpenedApp = null;

/**
 * 已打开的应用清单
 * @type {OpenedApp[]}
 * @private
 */
const openedApps = [];

/**
 * 获取已打开的应用清单
 * @return {OpenedApp[]} 已打开的应用清单
 */
export const getOpenedApps = () => openedApps;

/**
 * 判断指定 ID 的应用是否是默认打开的应用
 * @param {string} id 应用 ID
 * @returns {boolean} 如果返回 `true` 则为是默认打开的应用，否则为不是默认打开的应用
 */
export const isDefaultOpenedApp = id => id === defaultOpenedApp.id;

/**
 * 判断应用是否已经打开
 * @param {string} appNameOrID 要查找的应用名称或者打开的应用 ID
 * @returns {boolean} 如果返回 `true` 则为已经打开，否则为没有打开
 * @private
 */
export const isAppOpen = appNameOrID => openedApps.find(x => x.id === appNameOrID || x.app.name === appNameOrID);

/**
 * 查找打开的应用
 * @param {string} appNameOrID 要查找的应用名称或者打开的应用 ID
 * @return {OpenedApp}
 */
export const getOpenedApp = appNameOrID => openedApps.find(x => x.id === appNameOrID || x.app.name === appNameOrID);

/**
 * 获取打开的应用索引
 * @param {string} id 应用 ID
 * @returns {number} 应用索引
 * @private
 */
const getOpenedAppIndex = id => openedApps.findIndex(x => x.id === id);

/**
 * 当前已经激活的应用
 * @type {OpenedApp}
 * @private
 */
let currentOpenedApp = null;

/**
 * 判断给定 ID 的应用是否激活
 * @param {string} id 应用 ID
 * @returns {boolean} 如果返回 `true` 则为已经激活，否则为没有激活
 */
export const isCurrentOpenedApp = id => (currentOpenedApp && currentOpenedApp.id === id);

/**
 * 获取当前激活的应用
 * @return {OpenedApp} 当前激活的应用
 */
export const getCurrentOpenedApp = () => currentOpenedApp;

/**
 * 打开应用，如果应用已经打开则激活应用
 * @param {string} name 应用名称
 * @param {?string} [pageName=null] 子界面名称
 * @param {?(Object|string)} [params=null] 界面访问参数
 * @returns {boolean} 如果返回 `true` 则为操作成功，否则为操作失败
 */
export const openApp = (name, pageName = null, params = null) => {
    if (name instanceof OpenedApp) {
        const app = name;
        name = app.appName;
        params = pageName;
        // eslint-disable-next-line prefer-destructuring
        pageName = app.pageName;
    }

    const id = OpenedApp.createId(name, pageName);
    let theOpenedApp = isAppOpen(id);
    if (!theOpenedApp) {
        const theApp = getAppExt(name);
        if (theApp) {
            theOpenedApp = new OpenedApp(theApp, pageName, params);
            openedApps.push(theOpenedApp);
            if (DEBUG) {
                console.collapse('Extension Open App', 'greenBg', id, 'greenPale');
                console.trace('app', theOpenedApp);
                console.groupEnd();
            }
        } else {
            if (DEBUG) {
                console.color('Extension', 'greenBg', name, 'redPale', `Cannot open app '${name}', because cannot find it.`);
            }
            return false;
        }
    } if (params !== null) {
        theOpenedApp.params = params;
    }
    theOpenedApp.updateOpenTime();
    const appHashRoute = theOpenedApp.hashRoute;
    if (window.location.hash !== appHashRoute) {
        window.location.hash = appHashRoute;
    }
    currentOpenedApp = theOpenedApp;
    if (DEBUG) {
        console.collapse('Extension Active App', 'greenBg', id, 'greenPale');
        console.trace('app', theOpenedApp);
        console.groupEnd();
    }
    return true;
};

/**
 * 打开应用指定地址，如果应用已经打开则激活应用
 * @param {string} name 应用名称
 * @param {string} url 应用内部地址
 * @param {?string} [pageName=null] 子界面名称
 * @returns {boolean} 如果返回 `true` 则为操作成功，否则为操作失败
 */
export const openAppWithUrl = (name, url, pageName = null) => {
    openApp(name, pageName, `DIRECT=${url}`);
};

/**
 * 根据应用 ID 打开应用，如果应用已经打开则激活应用
 * @param {string} id 应用 ID
 * @param {?(Object|string)} [params=null] 界面访问参数
 * @returns {boolean} 如果返回 `true` 则为操作成功，否则为操作失败
 */
export const openAppById = (id, params = null) => {
    let name = id;
    let pageName = null;
    const indexOfAt = id.indexOf('@');
    if (indexOfAt > 0) {
        name = id.substr(0, indexOfAt);
        pageName = id.substr(indexOfAt + 1);
    }
    return openApp(name, pageName, params);
};

/**
 * 激活下一个打开的应用
 * @return {void}
 */
export const openNextApp = () => {
    let theMaxOpenTimeApp = null;
    openedApps.forEach(theOpenedApp => {
        if (!theMaxOpenTimeApp || theOpenedApp.openTime > theMaxOpenTimeApp.openTime) {
            theMaxOpenTimeApp = theOpenedApp;
        }
    });
    theMaxOpenTimeApp = theMaxOpenTimeApp || defaultOpenedApp;
    openApp(theMaxOpenTimeApp);
};

/**
 * 关闭应用
 * @param {string} id 应用 ID
 * @param {boolean} [openNext=true] 是否关闭应用之后激活下一个打开的应用
 * @returns {boolean} 如果返回 `true` 则为操作成功，否则为操作失败
 */
export const closeApp = (id, openNext = true) => {
    const theOpenedAppIndex = getOpenedAppIndex(id);
    if (theOpenedAppIndex > -1) {
        openedApps.splice(theOpenedAppIndex, 1);
        if (isCurrentOpenedApp(id)) {
            currentOpenedApp = null;
            if (openNext) {
                openNextApp();
                return true;
            }
        }
        return 'refresh';
    }
    return false;
};

/**
 * 关闭所有已经打开的应用（除了在界面上固定的应用）
 * @return {void}
 */
export const closeAllApp = () => {
    openedApps.map(x => x.name).forEach(theOpenedApp => {
        if (!theOpenedApp.fixed) {
            closeApp(theOpenedApp.name, false);
        }
    });
};

/**
 * 尝试卸载应用，默认会弹出对话框询问用户是否确定卸载
 * @param {Extension} extension 要卸载的扩展
 * @param {boolean} [confirm=true] 是否在卸载之前询问用户
 * @param {function} callback 操作完成后的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const tryUninstallExtension = (extension, confirm = true, callback = null) => {
    if (typeof confirm === 'function') {
        callback = confirm;
        confirm = true;
    }
    if (confirm) {
        return Modal.confirm(Lang.format('ext.uninstallConfirm.format', extension.displayName)).then(confirmed => {
            if (confirmed) {
                return uninstallExtension(extension, false, callback);
            }
            return Promise.reject();
        });
    }
    return uninstallExtension(extension).then(() => {
        Messager.show(Lang.format('ext.uninstallSuccess.format', extension.displayName), {type: 'success'});
        if (callback) {
            callback();
        }
    }).catch(error => {
        if (error) {
            Messager.show(Lang.error(error), {type: 'danger'});
        }
    });
};

/**
 * 安装扩展
 * @param {boolean} [devMode=false] 是否为开发模式
 * @return {void}
 */
export const installExtension = (devMode = false) => {
    openInstallExtensionDialog((extension, error) => {
        if (extension) {
            Messager.show(Lang.format('ext.installSuccess.format', extension.displayName), {type: 'success'});
        } else if (error) {
            let msg = Lang.string('ext.installFail');
            if (error) {
                msg += Lang.error(error);
            }
            Messager.show(msg, {type: 'danger'});
        }
    }, devMode);
};

/**
 * 显示扩展详情对话框
 * @param {Extension} extension 扩展对象
 * @param {function} callback 对话框显示完成后的回调函数
 * @return {void}
 */
export const showExtensionDetailDialog = (extension, callback) => ExtensionDetailDialog.show(extension, callback);

/**
 * 创建扩展上下文菜单项清单
 * @param {Extension} extension 扩展对象
 * @return {Object[]} 上下文菜单项清单
 */
export const createSettingContextMenu = extension => {
    const items = [];

    if (extension.disabled) {
        if (!extension.buildIn && !extension.isRemote) {
            items.push({
                label: Lang.string('ext.enable'),
                click: setExtensionDisabled.bind(null, extension, false, null)
            });
        }
    } else {
        if (extension.isApp) {
            items.push(extension.avaliable ? {
                label: Lang.string('ext.openApp'),
                click: openApp.bind(null, extension.name, null, null)
            } : {
                disabled: true,
                label: `${Lang.string('ext.openApp')} (${Lang.string(extension.needRestart ? 'ext.extension.needRestart' : 'ext.unavailable')})`,
            });
            if (extension.canPinnedOnMenu) {
                if (items.length && items[items.length - 1].type !== 'separator') {
                    items.push({type: 'separator'});
                }
                items.push({
                    label: Lang.string(extension.pinnedOnMenu ? 'ext.app.unpinnedOnMenu' : 'ext.app.pinnedOnMenu'),
                    click: () => {
                        extension.pinnedOnMenu = !extension.pinnedOnMenu;
                        saveExtensionData(extension);
                    }
                });
            }
        }
        if (!extension.buildIn && !extension.isRemote) {
            items.push({
                label: Lang.string('ext.disable'),
                click: setExtensionDisabled.bind(null, extension, true, null)
            });
        }
    }
    if (extension.buildIn) {
        items.push({
            label: Lang.string('ext.cannotUninstallBuidIn'),
            disabled: true,
        });
    } else if (extension.isRemote) {
        items.push({
            label: Lang.string('ext.cannotUninstallRemote'),
            disabled: true,
        });
    } else {
        items.push({
            label: Lang.string('ext.uninstall'),
            click: () => {
                tryUninstallExtension(extension);
            }
        });
    }
    return items;
};

/**
 * 显示（在用户系统桌面打开）开发中的扩展所在的文件夹
 * @param {Extension} extension 扩展对象
 * @returns {boolean} 如果返回 `true` 则操作成功，否则操作失败
 */
export const showDevFolder = extension => {
    const {localPath} = extension;
    if (localPath) {
        platformUI.showItemInFolder(Path.join(localPath, 'package.json'));
        return true;
    }
    return false;
};

/**
 * 创建应用扩展上下文菜单项清单
 * @param {AppExtension} appExt 应用扩展
 * @return {Object[]} 上下文菜单项清单
 */
export const createAppContextMenu = appExt => {
    const items = [];
    items.push({
        label: Lang.string('ext.app.open'),
        click: () => {
            openApp(appExt.name);
        }
    });
    if (appExt.webViewUrl && !appExt.isLocalWebView) {
        items.push({
            label: Lang.string('ext.app.openInBrowser'),
            click: () => appExt.getEntryUrl().then(url => {
                platformUI.openExternal(url);
                return url;
            })
        });
    }

    if (appExt.canPinnedOnMenu) {
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string(appExt.pinnedOnMenu ? 'ext.app.unpinnedOnMenu' : 'ext.app.pinnedOnMenu'),
            click: () => {
                appExt.pinnedOnMenu = !appExt.pinnedOnMenu;
                saveExtensionData(appExt);
            }
        });
    }

    if (!appExt.buildIn && !appExt.isRemote) {
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string('ext.uninstall'),
            click: () => {
                tryUninstallExtension(appExt);
            }
        });
    }

    if (items.length && items[items.length - 1].type !== 'separator') {
        items.push({type: 'separator'});
    }
    items.push({
        label: Lang.string('ext.app.about'),
        click: () => {
            showExtensionDetailDialog(appExt);
        }
    });
    return items;
};

/**
 * 创建打开的应用上下文菜单项清单
 * @param {OpenedApp} theOpenedApp 打开的应用
 * @param {function} refreshUI 请求刷新界面的回调函数
 * @return {Object[]} 上下文菜单项清单
 */
export const createOpenedAppContextMenu = (theOpenedApp, refreshUI) => {
    const items = [];
    if (theOpenedApp.webview) {
        items.push({
            label: Lang.string('ext.app.refresh'),
            click: () => {
                if (theOpenedApp.webview) {
                    theOpenedApp.webview.reload();
                }
            }
        });
        items.push({
            label: Lang.string('ext.app.goBack'),
            disabled: !theOpenedApp.webview.canGoBack(),
            click: () => {
                if (theOpenedApp.webview) {
                    theOpenedApp.webview.goBack();
                }
            }
        });
        items.push({
            label: Lang.string('ext.app.goForward'),
            disabled: !theOpenedApp.webview.canGoForward(),
            click: () => {
                if (theOpenedApp.webview) {
                    theOpenedApp.webview.goForward();
                }
            }
        });
        items.push({
            label: Lang.string('ext.app.goHome'),
            disabled: false,
            click: () => {
                if (theOpenedApp.webview) {
                    return theOpenedApp.app.getEntryUrl().then(url => {
                        theOpenedApp.webview.loadURL(url);
                        return url;
                    });
                }
            },
        });
    }
    if (theOpenedApp.id !== defaultOpenedApp.id) {
        if (items.length) {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string('ext.app.close'),
            click: () => {
                const closeAppResult = closeApp(theOpenedApp.name);
                if (closeAppResult && closeAppResult !== true && refreshUI) {
                    refreshUI();
                }
            }
        });
    }
    const appExt = theOpenedApp.app;
    if (appExt.webViewUrl && !appExt.isLocalWebView) {
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string('ext.app.openInBrowser'),
            click: () => {
                const currentUrl = theOpenedApp.webview && theOpenedApp.webview.src;
                return appExt.getEntryUrl(currentUrl).then(url => {
                    platformUI.openExternal(url);
                    return url;
                });
            }
        });
        if (theOpenedApp.webview && clipboard && clipboard.writeText) {
            items.push({
                label: Lang.string('ext.app.copyUrl'),
                click: () => {
                    clipboard.writeText(theOpenedApp.webview.src || appExt.webViewUrl);
                },
            });
        }
    }

    if (appExt.canPinnedOnMenu) {
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string(appExt.pinnedOnMenu ? 'ext.app.unpinnedOnMenu' : 'ext.app.pinnedOnMenu'),
            click: () => {
                appExt.pinnedOnMenu = !appExt.pinnedOnMenu;
                saveExtensionData(appExt);
            }
        });
    }

    if (DEBUG && theOpenedApp.webview) {
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string('ext.app.openDevTools'),
            click: () => {
                theOpenedApp.webview.openDevTools();
            }
        });
    }
    return items;
};

/**
 * 创建导航上的应用上下文菜单项
 * @param {AppExtension} appExt 打开的应用
 * @param {function} refreshUI 请求刷新界面的回调函数
 * @return {Object[]} 上下文菜单项清单
 */
export const createNavbarAppContextMenu = (appExt, refreshUI) => {
    const theOpenedApp = getOpenedApp(appExt.name);
    const items = [];
    if (theOpenedApp) {
        if (!isCurrentOpenedApp(theOpenedApp.id)) {
            items.push({
                label: Lang.string('ext.app.open'),
                click: () => {
                    openApp(appExt.name);
                }
            });
        }
        items.push(...createOpenedAppContextMenu(theOpenedApp, refreshUI));
        if (items.length && items[items.length - 1].type !== 'separator') {
            items.push({type: 'separator'});
        }
        items.push({
            label: Lang.string('ext.app.about'),
            click: () => {
                showExtensionDetailDialog(appExt);
            }
        });
    } else {
        items.push(...createAppContextMenu(appExt));
    }
    return items;
};

/**
 * 初始化扩展界面功能
 * @return {void}
 */
export const initUI = () => {
    defaultOpenedApp = new OpenedApp(getDefaultApp());
    openedApps.push(defaultOpenedApp);
};

export default {
    get openedApps() {
        return openedApps;
    },

    get currentOpenedApp() {
        return currentOpenedApp || defaultOpenedApp;
    },

    get defaultOpenedApp() {
        return defaultOpenedApp;
    },

    isDefaultApp: isDefaultOpenedApp,
    isCurrentOpenedApp,
    openApp,
    openAppById,
    getOpenedApp,
    closeApp,
    closeAllApp,
    openAppWithUrl,

    createSettingContextMenu,

    typeColors: {
        app: '#304ffe',
        theme: '#f50057',
        plugin: '#00c853',
    },

    installExtension,
    uninstallExtension: tryUninstallExtension,

    showDevFolder,
    createAppContextMenu,
    showExtensionDetailDialog,
    createOpenedAppContextMenu,
    createNavbarAppContextMenu,
};
