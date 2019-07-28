import Xext from './external-api';
import Exts, {
    forEachExtension, getExt, getExts, initExtensions
} from './exts';
import {initThemes} from './themes';
import {showExtensionDetailDialog, openAppWithUrl, initUI} from './ui';
import {reloadDevExtension} from './manager';
import App from '../core';
import {setExtensionUser} from './extension';
import {registerCommand, executeCommand, createCommandObject} from '../core/commander';
import {fetchServerExtensions, detachServerExtensions, getEntryVisitUrl} from './server';
import ExtsView from '../views/exts/index';
import _ExtsNavbarView from '../views/exts/navbar';
import withReplaceView from '../views/with-replace-view';

/**
 * ExtsNavbarView 可替换组件形式
 * @type {Class<ExtsNavbarView>}
 * @private
 */
const ExtsNavbarView = withReplaceView(_ExtsNavbarView);

// 将开放给扩展的模块设置为全局可访问
global.Xext = Xext;

/**
 * 保存扩展中提供的所有可替换组件类
 * @type {Map<string, Class<Component>>}
 * @private
 */
const replaceViews = {};

/**
 * 加载所有扩展模块
 * @return {void}
 */
export const loadExtensionsModules = () => {
    initExtensions();

    forEachExtension(ext => {
        if (ext.isDev) {
            const reloadExt = reloadDevExtension(ext);
            if (reloadExt) {
                ext = reloadExt;
            }
        } else {
            ext.attach();
        }
        if (ext.hasReplaceViews) {
            Object.assign(replaceViews, ext.replaceViews);
        }
    });

    initThemes();
    initUI();
};

// 监听应用的准备就绪事件，触发扩展的 `onReady` 回调函数
App.ui.onReady(() => {
    forEachExtension(ext => {
        ext.callModuleMethod('onReady', ext);
    });
});

// 监听用户登录事件，触发扩展的 `onUserLogin` 回调函数
App.server.onUserLogin((user, error) => {
    if (user && !error) {
        setExtensionUser(user);
        forEachExtension(ext => {
            ext.callModuleMethod('onUserLogin', user);
        });
        if (user.isOnline) {
            fetchServerExtensions(user);
        }
    }
});

// 监听用户退出事件，触发扩展的 `onUserLogout` 回调函数
App.server.onUserLogout((user, code, reason, unexpected) => {
    setExtensionUser(null);
    forEachExtension(ext => {
        ext.callModuleMethod('onUserLogout', user, code, reason, unexpected);
    });
    detachServerExtensions(user);
});

// 监听用户状态变更事件，触发扩展的 `onUserStatusChange` 回调函数
App.profile.onUserStatusChange((status, oldStatus, user) => {
    forEachExtension(ext => {
        ext.callModuleMethod('onUserStatusChange', status, oldStatus, user);
    });
});

// 监听用户发送聊天消息事件，触发扩展的 `onSendChatMessages` 回调函数
App.im.server.onSendChatMessages((messages, chat) => {
    forEachExtension(ext => {
        ext.callModuleMethod('onSendChatMessages', messages, chat, App.profile.user);
    });
});

// 监听用户接收到聊天消息事件，触发扩展的 `onReceiveChatMessages` 回调函数
App.im.server.onReceiveChatMessages((messages) => {
    forEachExtension(ext => {
        ext.callModuleMethod('onReceiveChatMessages', messages, App.profile.user);
    });
});

// 监听界面渲染消息事件，触发扩展的 `onRenderChatMessageContent` 回调函数
App.im.ui.onRenderChatMessageContent(content => {
    forEachExtension(ext => {
        const result = ext.callModuleMethod('onRenderChatMessageContent', content);
        if (result !== undefined) {
            content = result;
        }
    });
    return content;
});

// 注册扩展命令
registerCommand('extension', (context, extName, commandName, ...params) => {
    const ext = getExt(extName);
    if (ext) {
        const command = ext.getCommand(commandName);
        if (command) {
            return executeCommand(createCommandObject(command, null, {extension: ext}), ...params);
        }
        if (DEBUG) {
            console.collapse('Command.execute.extension', 'redBg', commandName, 'redPale', 'command not found', 'redBg');
            console.log('ext', ext);
            console.log('params', params);
            console.log('context', context);
            console.groupEnd();
        }
    } else if (DEBUG) {
        console.collapse('Command.execute.extension', 'redBg', commandName, 'redPale', 'extension not found', 'redBg');
        console.log('extName', extName);
        console.log('params', params);
        console.log('context', context);
        console.groupEnd();
    }
});

// 注册 `showExtensionDialog` 命令，用于使用命令显示扩展详情对话框
registerCommand('showExtensionDialog', (context, extName) => {
    const ext = getExt(extName);
    if (ext) {
        return showExtensionDetailDialog(ext);
    }
});

// 注册 `openInApp` 命令，用于使用命令在扩展应用中打开链接
registerCommand('openInApp', (context, appName, url) => {
    openAppWithUrl(appName, url);
});

/**
 * 获取扩展中定义的网址解析器
 *
 * @param {string} url 要解析的网址
 * @param {string} [type='inspect'] 解析类型，包括 `'inspect'` 和 `'open'`
 * @return {any} 网址解析器对象
 * @memberof Extension
 */
export const getExtensionUrlInspector = (url, type = 'inspect') => {
    let urlInspector = null;
    if (getExts().some(x => {
        if (!x.disabled) {
            const xInspector = x.getUrlInspector(url, type);
            if (xInspector) {
                urlInspector = xInspector;
                return true;
            }
        }
        return false;
    })) {
        return urlInspector;
    }
};

/**
 * 获取扩展中定义的网址打开处理器
 *
 * @param {string} url 要打开的网址
 * @return {any} 网址打开处理器对象
 * @memberof Extension
 */
export const getExtensionUrlOpener = url => getExtensionUrlInspector(url, 'open');

/**
 * 获取指定的通知消息发送者信息配置对象
 * @param {Object|string} sender 发送者 ID 或发送者信息对象
 * @return {Object} 发送者信息配置对象
 */
export const getNotificationSender = sender => {
    if (typeof sender !== 'object') {
        sender = {id: sender};
    }
    let extSender = null;
    if (getExts().some(x => {
        if (!x.disabled) {
            const xSender = x.getNotificationSender(sender);
            if (xSender) {
                extSender = xSender;
                return true;
            }
        }
        return false;
    })) {
        return extSender;
    }
};

// 将扩展中提供的所有可替换组件类设置为全局可访问
global.replaceViews = Object.assign(global.replaceViews || {}, replaceViews);

export default {
    loadModules: loadExtensionsModules,
    getUrlInspector: getExtensionUrlInspector,
    getUrlOpener: getExtensionUrlOpener,
    exts: Exts,
    getEntryVisitUrl,
    ExtsView,
    ExtsNavbarView,
    getNotificationSender,
};
