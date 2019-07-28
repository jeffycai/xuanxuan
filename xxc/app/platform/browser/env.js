/**
 * 操作系统平台
 * @type {string}
 * @private
 */
let osPlatform = null;

/**
 * 浏览器 userAgent 字符串
 * @private
 * @type {string}
 */
const {userAgent} = window.navigator;


/**
 * 当前运行的操作系统是否是 Mac
 * @type {boolean}
 * @private
 */
const isOSX = userAgent.includes('Mac OS');

/**
 * 当前运行的操作系统是否是 Windows
 * @type {boolean}
 * @private
 */
const isWindowsOS = userAgent.includes('Windows');

/**
 * 当前运行的操作系统是否是 Linux
 * @type {boolean}
 * @private
 */
const isLinux = userAgent.includes('Linux');

if (isOSX) {
    osPlatform = 'osx';
} else if (isWindowsOS) {
    osPlatform = 'windows';
} else if (isLinux) {
    osPlatform = 'linux';
}

/**
 * 当前操作系统运行环境信息
 * @type {Object}
 * @property {string} os 操作系统类型，包括 MacOS(`'osx'`)，Windows(`'windows'`) 或 Linux(`'linux'`)
 * @property {boolean} isWindowsOS 当前运行的操作系统是否是 Windows
 * @property {boolean} isOSX 当前运行的操作系统是否是 Mac OS
 * @property {boolean} isLinux 当前运行的操作系统是否是 Linux
 */
export default {
    os: osPlatform,
    isWindowsOS,
    isOSX,
    isLinux,
};
