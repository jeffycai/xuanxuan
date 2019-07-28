import Store from '../utils/store';
import {createExtension} from './extension';

/** 扩展数据库管理 */

/**
 * 扩展数据库本地存储键前缀
 * @type {string}
 * @private
 */
const STORE_KEY = 'EXTENSIONS::database';

/**
 * 扩展变更回调函数
 * @type {function}
 * @private
 */
let onChangeListener = null;

/**
 * 存储本地数据中的所有扩展
 * @type {Extension[]}
 * @private
 */
const installs = Store.get(STORE_KEY, []).map(data => {
    return createExtension(data);
});

/**
 * 获取已安装的所有扩展
 * @return {Extension[]} 已安装的所有扩展列表
 */
export const getInstalledExtensions = () => installs;

/**
 * 将已安装的扩展保存到本地存储
 * @return {void}
 */
export const saveExtensionsToStore = () => {
    Store.set(STORE_KEY, installs.map(x => x.storeData));
};

/**
 * 获取指定名称的扩展
 * @param {stirng} name 扩展名称
 * @return {Extension} 扩展对象
 */
export const getInstalledExtension = name => {
    return installs.find(x => x.name === name);
};

/**
 * 获取扩展存储索引
 * @param {stirng} name 扩展名称
 * @return {number} 扩展索引
 */
export const getIndexOfInstallExtension = name => {
    return installs.findIndex(x => x.name === name);
};

/**
 * 安装扩展并保存到数据库
 * @param {Extension} extension 扩展
 * @param {boolean} [override=false] 是否覆盖已安装的同名扩展
 * @param {function} beforeSave 在保存之前的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const saveInstalledExtension = (extension, override = false, beforeSave = null) => {
    if (extension.isRemote) {
        if (onChangeListener) {
            onChangeListener(extension, 'update');
        }
        return Promise.resolve(extension);
    }
    const oldExtensionIndex = getIndexOfInstallExtension(extension.name);
    if (oldExtensionIndex > -1) {
        if (!override) {
            return Promise.reject(new Error('EXT_NAME_ALREADY_INSTALLED'));
        }
        const oldExtension = installs[oldExtensionIndex];
        extension._data = Object.assign(oldExtension.data, extension._data);
        extension.updateTime = new Date().getTime();
        installs.splice(oldExtensionIndex, 1, extension);
    } else {
        if (extension.installTime === undefined) {
            extension.installTime = new Date().getTime();
        }
        installs.push(extension);
    }
    if (beforeSave) {
        beforeSave(extension);
    }
    saveExtensionsToStore();
    if (onChangeListener) {
        onChangeListener(extension, oldExtensionIndex > -1 ? 'update' : 'add');
    }
    return Promise.resolve(extension);
};

/**
 * 从已安装的扩展中移除
 * @param {Extension} extension 扩展
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const removeInstalledExtension = extension => {
    const index = getIndexOfInstallExtension(extension.name);
    if (index < 0) {
        return Promise.reject(new Error('EXT_NOT_FOUND'));
    }
    installs.splice(index, 1);
    saveExtensionsToStore();
    if (onChangeListener) {
        onChangeListener(extension, 'remove');
    }
    return Promise.resolve();
};

/**
 * 根据名称从已安装的扩展中移除
 * @param {string} name 扩展名称
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const removeInstalledExtensionByName = name => {
    const extension = getInstalledExtension(name);
    if (extension) {
        return removeInstalledExtension(extension);
    }
    return Promise.reject(new Error('EXT_NOT_FOUND'));
};

/**
 * 设置扩展变更回调函数
 * @param {function} listener 回调函数
 * @return {void}
 */
export const setOnInstalledExtensionChangeListener = listener => {
    onChangeListener = listener;
};

/**
 * 保存扩展数据
 * @param {Extension} extension 扩展对象
 * @return {void}
 */
export const saveExtensionData = (extension) => {
    extension.saveData();
    onChangeListener(extension, 'update');
};

export default {
    get installs() {
        return installs;
    },

    getInstall: getInstalledExtension,
    saveInstall: saveInstalledExtension,
    removeInstall: removeInstalledExtension,
    setOnChangeListener: setOnInstalledExtensionChangeListener,
    removeInstallByName: removeInstalledExtensionByName,
};
