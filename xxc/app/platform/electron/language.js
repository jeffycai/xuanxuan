import path from 'path';
import fse from 'fs-extra';
import {remote} from 'electron';
import env from './env';
import {ipcSend, remoteOn} from './remote';
import EVENTS from './remote-events';

/**
 * 获取语言表数据
 * @param {String} langName 语言名称
 * @return {Map<String, String>} 语言表数据对象
 */
export const loadLangData = (langName) => {
    const langFilePath = path.join(process.env.HOT ? env.appRoot : env.appPath, 'lang', `${langName || getPlatformLangName()}.json`);
    return fse.readJSON(langFilePath, {throws: false});
};

/**
 * 获取系统平台所使用的默认语言名称
 * @return {String} 系统默认语言名称
 */
export const getPlatformLangName = () => (remote.app.getLocale() || navigator.language).toLowerCase();

/**
 * 处理语言变更事件
 * @param {String} langName 当前语言名称
 * @param {String} langData 当前语言数据
 * @return {void}
 */
export const handleLangChange = (langName, langData) => {
    ipcSend(EVENTS.remote_lang_change, langName, langData, env.windowName);
};

/**
 * 语言变更处理函数
 * @type {function}
 * @private
 */
let requestChangeLangHandler = null;

/**
 * 设置请求变更语言处理函数
 * @param {function(string)} handler 处理函数
 * @return {void}
 */
export const setRequestChangeLangHandler = (handler) => {
    requestChangeLangHandler = handler;
};

/**
 * 初始化语言访问功能
 * @return {void}
 */
export const initLanguage = () => {
    // 处理其他窗口请求变更语言事件
    remoteOn(EVENTS.remote_lang_change, (e, langName, langData, windowName) => {
        console.error('EVENTS.remote_lang_change', {
            e, langName, langData, windowName,
        });
        if (requestChangeLangHandler && windowName !== env.windowName) {
            requestChangeLangHandler(langName);
        }
    });
};


export default {
    loadLangData,
    getPlatformLangName,
    handleLangChange,
    setRequestChangeLangHandler,
};
