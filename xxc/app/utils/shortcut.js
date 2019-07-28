import platform from '../platform';

const {isWindowsOS, isOSX} = platform.access('env');

/**
 * 按键代码与按键名称表
 * @type {Object.<number,string>}
 * @private
 */
const specialKeys = {
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    16: 'Shift',
    17: 'Ctrl',
    18: 'Alt',
    19: 'Pause',
    20: 'Capslock',
    27: 'Esc',
    32: 'Space',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',
    45: 'Insert',
    46: 'Del',
    96: '0',
    97: '1',
    98: '2',
    99: '3',
    100: '4',
    101: '5',
    102: '6',
    103: '7',
    104: '8',
    105: '9',
    106: '*',
    107: '+',
    109: '-',
    110: '.',
    111: '/',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'Scroll',
    191: '/',
    224: 'Meta'
};

/**
 * 修饰键集合
 * @type {Set}
 * @private
 */
const modifyKeys = new Set(['Alt', 18, 'Meta', 224, 'Ctrl', 17, 'Shift', 16, 'Option', 'Windows', 'Command']);

/**
 * 格式化快捷键组合字符串
 * @param {string} decoration 快捷键组合字符串
 * @return {string}
 * @function
 */
export const formatKeyDecoration = decoration => {
    if (decoration) {
        if (isWindowsOS) {
            decoration = decoration.replace('Meta', 'Windows').replace('Command', 'Windows').replace('Option', 'Alt');
        } else if (isOSX) {
            decoration = decoration.replace('Meta', 'Command').replace('Windows', 'Command').replace('Alt', 'Option');
        } else {
            decoration = decoration.replace('Command', 'Meta').replace('Windows', 'Meta').replace('Option', 'Alt');
        }
    }
    return decoration;
};

/**
 * 根据键盘按键事件对象获取快捷键组合字符串
 * @param {Event} event 键盘按键事件对象
 * @return {string}
 * @function
 */
export const getKeyDecoration = event => {
    const {keyCode} = event;
    const shortcut = [];
    if (event.shiftKey) {
        shortcut.push('Shift');
    }
    if (event.ctrlKey) {
        shortcut.push('Ctrl');
    }
    if (event.altKey) {
        shortcut.push('Alt');
    }
    if (event.metaKey) {
        shortcut.push('Meta');
    }
    if (keyCode && !modifyKeys.has(keyCode)) {
        if (specialKeys[keyCode]) {
            shortcut.push(specialKeys[keyCode]);
        } else {
            shortcut.push(String.fromCharCode(keyCode) || event.key);
        }
    }
    return formatKeyDecoration(shortcut.join('+'));
};

/**
 * 快捷键组合字符串中是否仅仅包含修饰键
 * @param {string} decoration 快捷键组合字符串
 * @return {boolean}
 * @function
 */
export const isOnlyModifyKeys = decoration => {
    if (!decoration) {
        return false;
    }
    return decoration.split('+').every(x => (modifyKeys.has(x)));
};
