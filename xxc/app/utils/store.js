/** @module utils/store */

/**
 * 本地存储对象
 * @type {Storage}
 * @private
 */
const storage = window.localStorage;

/**
 * 将 JS 值序列化为 JSON 字符串
 * @param {any} value 要序列化的值
 * @return {string}
 * @private
 */
const serialize = value => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
};

/**
 * 将 JSON 字符串反序列化为 JS 值
 * @param {string} value 要反序列化的字符串
 * @return {any}
 * @private
 */
const deserialize = value => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        // eslint-disable-next-line no-empty
        } catch (ignore) {}
    }
    return value;
};

/**
 * 设置本地存储值
 * @param {string} key 键
 * @param {any} value 值
 * @return {void}
 */
export const setStoreItem = (key, value) => {
    storage.setItem(key, serialize(value));
};

/**
 * 获取本地存储值
 * @param {string} key 键
 * @param {any} defaultValue 默认值
 * @return {any}
 */
export const getStoreItem = (key, defaultValue) => {
    const val = deserialize(storage.getItem(key));
    return val === null ? defaultValue : val;
};

/**
 * 移除本地存储值
 * @param {string} key 键
 * @return {void}
 */
export const removeStoreItem = key => storage.removeItem(key);

/**
 * 清空本地存储
 * @return {void}

 */
export const clearStore = () => storage.clear();

/**
 * 获取本地存储条目数目
 * @return {number}
 */
export const getStoreLength = () => storage.length;

/**
 * 遍历本地存储所有条目
 * @param {function} callback 遍历回调函数
 * @return {void}
 */
export const storeForEach = callback => {
    const length = getStoreLength();
    for (let i = 0; i < length; ++i) {
        const key = storage.key(i);
        if (callback) {
            callback(getStoreItem(key), key, i);
        }
    }
};

/**
 * 通过对象返回本地存储中的所有键值对
 * @return {Object.<string, any>}
 */
export const storeGetAll = () => {
    const all = {};
    storeForEach((value, key) => {
        all[key] = value;
    });
    return all;
};

export default {
    set: setStoreItem,
    get: getStoreItem,
    remove: removeStoreItem,
    clear: clearStore,
    forEach: storeForEach,
    get length() {
        return getStoreLength();
    },
    get all() {
        return storeGetAll();
    }
};
