import Config from '../config';
import getBuildIns from './build-in';
import {createExtension} from './extension';
import {setOnInstalledExtensionChangeListener, getInstalledExtensions} from './extensions-db';
import events from '../core/events';
import {setServerOnChangeListener} from './server';
import {onLangChange} from '../core/lang';

/**
 * 事件名称表
 * @type {Object}
 * @private
 */
const EVENT = {
    onChange: 'Extension.onChange'
};

/**
 * 扩展清单
 * @type {Extension[]}
 * @private
 */
const exts = [];

/**
 * 应用 package.json 文件数据
 * @type {Object}
 * @private
 */
const PKG = Config.pkg;

/**
 * 扩展排序函数
 * @return {void}
 */
const sortExts = () => {
    exts.sort((x, y) => {
        let result = (y.isDev ? 1 : 0) - (x.isDev ? 1 : 0);
        if (result === 0) {
            result = (y.disabled ? 0 : 1) - (x.disabled ? 0 : 1);
        }
        if (result === 0) {
            result = (y.isRemote ? 1 : 0) - (x.isRemote ? 1 : 0);
        }
        if (result === 0) {
            result = y.installTime - x.installTime;
        }
        return result;
    });
};

/**
 * 应用扩展列表
 * @type {AppExtension}
 * @private
 */
let apps;

/**
 * 主题扩展列表
 * @type {ThemeExtension}
 * @private
 */
let themes;

/**
 * 插件扩展列表
 * @type {PluginExtension}
 * @private
 */
let plugins;

/**
 * 对扩展进行分组
 * @return {void}
 * @private
 */
const groupExts = () => {
    apps = exts.filter(x => x.type === 'app');
    themes = exts.filter(x => x.type === 'theme');
    plugins = exts.filter(x => x.type === 'plugin');
};

/**
 * 扩展变更事件回调函数
 * @param {Extension[]} changedExts 变更的扩展清单
 * @param {string} changeAction 变更操作类型
 * @return {void}
 */
const onChangeListener = (changedExts, changeAction) => {
    if (!Array.isArray(changedExts)) {
        changedExts = [changedExts];
    }
    if (changeAction === 'remove') {
        changedExts.forEach(ext => {
            const findIndex = exts.findIndex(x => x.name === ext.name);
            if (findIndex > -1) {
                exts.splice(findIndex, 1);
            }
        });
    } else if (changeAction === 'update' || changeAction === 'add' || changeAction === 'upsert') {
        let hasExtAdd = false;
        changedExts.forEach(ext => {
            const findIndex = exts.findIndex(x => x.name === ext.name);
            if (findIndex > -1) {
                exts.splice(findIndex, 1, ext);
            } else {
                exts.splice(0, 0, ext);
                hasExtAdd = true;
            }
        });
        if (hasExtAdd) {
            sortExts();
        }
    }
    groupExts();
    events.emit(EVENT.onChange, changedExts, changeAction);
};

/**
 * 根据扩展类型获取扩展列表
 * @param {string} type 类型名称
 * @return {Extension[]} 扩展列表
 */
export const getTypeList = type => {
    switch (type) {
    case 'app':
        return apps;
    case 'theme':
        return themes;
    case 'plugin':
        return plugins;
    default:
        return exts;
    }
};

/**
 * 根据扩展名称和类型获取扩展
 * @param {string} name 扩展名称
 * @param {?string} type 扩展类型
 * @return {Extension} 扩展
 */
export const getExt = (name, type) => getTypeList(type).find(x => x.name === name);

/**
 * 根据名称获取应用扩展
 * @param {string} name 扩展名称
 * @return {AppExtension} 应用扩展
 */
export const getAppExt = name => (getExt(name, 'app'));

/**
 * 根据名称获取插件扩展
 * @param {string} name 扩展名称
 * @return {PluginExtension} 插件扩展
 */
export const getPluginExt = name => (getExt(name, 'plugin'));

/**
 * 根据名称获取主题扩展
 * @param {string} name 扩展名称
 * @return {ThemeExtension} 主题扩展
 */
export const getThemeExt = name => (getExt(name, 'theme'));

/**
 * 搜索扩展
 * @param {string} keys 搜索关键字
 * @param {string} [type='app'] 搜索的扩展类型
 * @return {Extension[]} 搜索到的扩展列表
 */
export const searchExts = (keys, type = 'app') => {
    keys = keys.trim().toLowerCase().split(' ');
    const result = [];
    getTypeList(type).forEach(theExt => {
        const score = theExt.getMatchScore(keys);
        if (score) {
            result.push({score, ext: theExt});
        }
    });
    result.sort((x, y) => y.score - x.score);
    return result.map(x => x.ext);
};

/**
 * 搜索应用扩展
 * @param {string} keys 搜索关键字
 * @return {AppExtension[]} 搜索到的应用扩展列表
 */
export const searchApps = keys => searchExts(keys);

/**
 * 绑定扩展变更事件
 * @param {funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onExtensionChange = listener => events.on(EVENT.onChange, listener);

/**
 * 遍历已安装的扩展
 * @param {function(Extension)} callback 遍历回调函数
 * @param {boolean} [includeDisabled=false] 是否包含已禁用的扩展
 * @return {void}
 */
export const forEachExtension = (callback, includeDisabled = false) => {
    exts.forEach(x => {
        if (!x.disabled || includeDisabled) {
            callback(x);
        }
    });
};

/**
 * 获取扩展列表
 * @return {Extension[]} 扩展列表
 */
export const getExts = () => exts;

/**
 * 获取应用扩展列表
 * @return {Extension[]} 应用扩展列表
 */
export const getAppExts = () => apps;

/**
 * 获取主题扩展列表
 * @return {Extension[]} 主题扩展列表
 */
export const getThemeExts = () => themes;

/**
 * 获取插件扩展列表
 * @return {Extension[]} 插件扩展列表
 */
export const getPluginExts = () => plugins;

/**
 * 默认扩展
 * @type {Extension}
 */
let defaultApp;

/**
 * 初始化扩展数据
 * @return {void}
 */
export const initExtensions = () => {
    // 安装内置扩展
    getBuildIns().forEach((buildIn, idx) => {
        if (!buildIn.publisher) {
            buildIn.publisher = Config.exts.buildInPublisher || Config.pkg.company;
        }
        if (!buildIn.author) {
            buildIn.author = Config.exts.buildInAuthor || Config.pkg.company;
        }
        ['version', 'license', 'homepage', 'bugs', 'repository'].forEach(key => {
            buildIn[key] = PKG[key];
        });
        exts.push(createExtension(buildIn, {installTime: idx, pinnedOnMenuOrder: idx}, true));
    });

    // 从数据库中加载用户安装的扩展
    exts.push(...getInstalledExtensions());

    // 对扩展进行排序
    sortExts();

    // 对扩展进行分组
    groupExts();

    // 设置已安装扩展变更事件回调函数
    setOnInstalledExtensionChangeListener(onChangeListener);

    // 设置服务器扩展变更事件回调函数
    setServerOnChangeListener(onChangeListener);

    defaultApp = apps.find(x => x.buildIn && x.buildIn.asDefault) || exts.apps[0];

    onLangChange(lang => {
        const changedExts = [];
        forEachExtension(ext => {
            if (ext.buildIn) {
                ext._pkg.displayName = lang.string(`exts.${ext.name}.label`);
                ext._pkg.description = lang.string(`exts.${ext.name}.desc`);
                changedExts.push(ext);
            }
        });
        onChangeListener(changedExts, 'update');
    });

    if (DEBUG) {
        console.collapse('Extensions Init', 'greenBg', `Total: ${exts.length}, Apps: ${apps.length}, Plugins: ${plugins.length}, Themes: ${themes.length}`, 'greenPale');
        console.log('exts', exts);
        console.log('apps', apps);
        console.log('themes', themes);
        console.log('plugins', plugins);
        console.groupEnd();
    }
};

/**
 * 获取默认应用
 * @return {AppExtension} 默认应用对象
 */
export const getDefaultApp = () => defaultApp;

export default {
    get exts() {
        return exts;
    },
    get apps() {
        return apps;
    },
    get themes() {
        return themes;
    },
    get plugins() {
        return plugins;
    },
    get defaultApp() {
        return defaultApp;
    },

    getTypeList,
    getExt,
    getApp: getAppExt,
    getPlugin: getPluginExt,
    getTheme: getThemeExt,

    search: searchExts,
    searchApps,
    onExtensionChange,
    forEach: forEachExtension,
};
