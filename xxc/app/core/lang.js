import LANG_ZH_CN from '../lang/zh-cn.json';
import platform from '../platform';
import {setStoreItem, getStoreItem} from '../utils/store';
import LangHelper from '../utils/lang-helper';
import events from './events';
import Config from '../config';

/**
 * 语言变更事件名称
 * @type {string}
 * @private
 */
const LANG_CHANGE_EVENT = 'lang.change';

/**
 * 语言访问辅助对象
 * @type {LangHelper}
 */
const langHelper = new LangHelper();

/**
 * 额外的语言表对象
 * @private
 * @type {Map<String, String>}
 */
let extraLangData = null;

/**
 * 上次变更语言的时间戳
 * @type {number}
 */
let isJustLangSwitchedFlag = false;

/**
 * 绑定语言变更事件
 * @param {function(String)} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 * @example
 * import {onLangChange} from './lang.js';
 * import {events} from './events';
 *
 * // 绑定语言变更事件
 * const langChangeHandler = onLangChange(newLang => {
 * });
 *
 * // 取消事件绑定
 * events.off(langChangeHandler);
 */
export const onLangChange = listener => events.on(LANG_CHANGE_EVENT, listener);

/**
 * 获取所有语言清单
 * @return {Array<{name: String, label: String}>} 语言清单列表
 */
export const getAllLangList = () => extraLangData.ALL || [{name: 'zh-cn', label: '简体中文'}];

/**
 * 是否刚刚变更了语言
 * @return {boolean} 如果为 `true`，则为刚刚变更了语言，否则没有
 */
export const isJustLangSwitched = () => isJustLangSwitchedFlag;

/**
 * 获取应用显示名称
 * @param {?String} langName 语言名称
 * @return {String} 语言显示名称
 */
export const getLangDisplayName = (langName) => {
    langName = langName || langHelper.name;
    const langSetting = getAllLangList().find(x => x.name === langName);
    return langSetting && langSetting.label;
};

/**
 * 获取平台预设的语言数据对象
 * 该语言数据默认会从 lang/ 目录下加载对应的语言文件
 * @param {String} langName 语言名称
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
const loadPlatformLangData = (langName) => {
    if (langName === 'zh-cn') {
        return Promise.resolve();
    }
    const platformResult = platform.call('language.loadLangData', langName);
    if (platformResult instanceof Promise) {
        return platformResult;
    }
    return Promise.resolve(platformResult);
};

/**
 * 更改界面语言
 * @param {String} langName 界面语言名称
 * @param {boolean} [notifyPlatform=true] 是否通知平台变更语言
 * @return {void}
 */
export const loadLanguage = (langName, notifyPlatform = true) => {
    if (!langName) {
        return Promise.reject(new Error('Must provide the langName.'));
    }
    if (langName !== langHelper.name) {
        return loadPlatformLangData(langName).then(platformLangData => {
            isJustLangSwitchedFlag = true;
            setTimeout(() => {
                isJustLangSwitchedFlag = false;
            }, 500);

            // 合并语言数据对象
            const langData = Object.assign({}, LANG_ZH_CN, platformLangData, extraLangData && extraLangData[langName]);

            // 变更语言
            langHelper.change(langName, langData);

            // 存储当前语言配置
            setStoreItem('LANG_NAME', langName);

            // 触发语言变更事件
            events.emit(LANG_CHANGE_EVENT, langHelper);

            if (notifyPlatform) {
                platform.call('language.handleLangChange', langName, langData);
            }
            return Promise.resolve();
        });
    }
    return Promise.resolve();
};

/**
 * 初始化界面语言文本访问功能
 * @param {Map<String, String>} extraData 额外的语言表数据对象
 * @return {void}
 */
export const initLang = (extraData) => {
    // 设置额外的语言表数据对象
    extraLangData = extraData;

    // 获取默认语言名称
    const langName = getStoreItem('LANG_NAME') || Config.ui.defaultLang || platform.call('language.getPlatformLangName') || 'zh-cn';

    // 绑定处理平台请求语言变更的情况
    const setRequestChangeLangHandler = platform.access('language.setRequestChangeLangHandler');
    if (setRequestChangeLangHandler) {
        setRequestChangeLangHandler((newLangName) => {
            loadLanguage(newLangName, false);
        });
    }

    // 加载语言
    return loadLanguage(langName);
};

if (DEBUG) {
    global.$lang = langHelper;
}

export default langHelper;
