import {getJSON} from '../common/network';

/**
 * 获取语言表数据
 * @param {String} langName 语言名称
 * @return {Promise<Map<String, String>, Error>} 使用 Promise 异步返回语言表数据对象
 */
export const loadLangData = (langName) => getJSON(`lang/${langName || getPlatformLangName()}.json`);

/**
 * 获取系统平台所使用的默认语言名称
 * @return {String} 系统默认语言名称
 */
export const getPlatformLangName = () => navigator.language.toLowerCase();

export default {
    loadLangData,
    getPlatformLangName,
};
