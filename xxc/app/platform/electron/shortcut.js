import {remote} from 'electron';

/**
 * 保存所有注册的全局快捷键
 * @type {Object}
 * @private
 */
const shortcuts = {};

/**
 * 取消注册全局快捷键
 * @param  {string} name 要取消的快捷键名称
 * @return {void}
 */
const unregisterGlobalShortcut = (name) => {
    const accelerator = shortcuts[name];
    if (accelerator) {
        try {
            remote.globalShortcut.unregister(accelerator);
        } catch (err) {
            if (DEBUG) {
                console.warn('Unregister shortcut error:', name, err);
            }
        }
        delete shortcuts[name];
        if (DEBUG) {
            console.color(`GLOBAL HOTKEY REMOVE ${name}: ${accelerator}`, 'purpleOutline');
        }
    }
};

/**
 * 注册全局快捷键
 * @param  {string} name 快捷键名称
 * @param  {Accelerator} accelerator 快捷键组合
 * @param  {function} callback 快捷键被激活时的回调函数
 * @return {void}
 */
const registerGlobalShortcut = (name, accelerator, callback) => {
    unregisterGlobalShortcut(name);
    if (accelerator) {
        shortcuts[name] = accelerator;
        try {
            remote.globalShortcut.register(accelerator, () => {
                if (DEBUG) {
                    console.color(`GLOBAL KEY ACTIVE ${name}: ${accelerator}`, 'redOutline');
                }
                callback();
            });
        } catch (err) {
            if (DEBUG) {
                console.warn('Register shortcut error:', name, accelerator, err);
            }
        }
        if (DEBUG) {
            console.color(`GLOBAL HOTKEY BIND ${name}: ${accelerator}`, 'purpleOutline');
        }
    } else if (DEBUG) {
        console.color(`GLOBAL HOTKEY BIND ${name}: error`, 'purpleOutline', 'Cannot bind empty accelerator', 'red');
    }
};

/**
 * 检查全局快捷键是否被注册
 * @param {Accelerator} accelerator 快捷键组合
 * @returns {boolean} 如果返回 `true` 则为被注册，否则为没有被注册
 */
const isGlobalShortcutRegistered = (accelerator) => remote.globalShortcut.isRegistered(accelerator);

export default {
    unregisterAll: remote.globalShortcut.unregisterAll,
    unregisterGlobalShortcut,
    registerGlobalShortcut,
    isGlobalShortcutRegistered
};
