import os from 'os';
import {remote as Remote} from 'electron';
import path from 'path';
import {getSearchParam} from '../../utils/html-helper';


/**
 * 访问地址参数表
 * @type {Map<string, string>}
 * @private
 */
const urlParams = getSearchParam();

/**
 * 当前窗口名称
 * @type {string}
 */
const windowName = urlParams._name;

/**
 * 操作系统平台
 * @type {string}
 * @private
 */
const OS_PLATFORM = os.platform();

/**
 * 用户个人数据文件夹路径
 * @type {string}
 * @private
 */
const dataPath = Remote.app.getPath('userData');

/**
 * 用户临时文件存储路径
 * @type {string}
 * @private
 */
const tmpPath = path.join(dataPath, 'temp');

/**
 * 用户桌面文件夹路径
 * @type {string}
 * @private
 */
const desktopPath = Remote.app.getPath('desktop');

/**
 * 当前运行的操作系统是否是 Mac
 * @type {boolean}
 * @private
 */
const isOSX = OS_PLATFORM === 'osx' || OS_PLATFORM === 'darwin';

/**
 * 当前运行的操作系统是否是 Windows
 * @type {boolean}
 * @private
 */
const isWindowsOS = OS_PLATFORM === 'win32' || OS_PLATFORM === 'win64';

/**
 * 当前运行的操作系统是否是 Linux
 * @type {boolean}
 * @private
 */
const isLinux = !isOSX && !isWindowsOS;

/**
 * 当前操作系统运行环境信息
 * @type {Object}
 * @property {string} os 操作系统类型，包括 MacOS(`'osx'`)，Windows(`'windows'`) 或 Linux(`'linux'`)
 * @property {boolean} isWindowsOS 当前运行的操作系统是否是 Windows
 * @property {boolean} isOSX 当前运行的操作系统是否是 Mac OS
 * @property {boolean} isLinux 当前运行的操作系统是否是 Linux
 * @property {string} arch 当前运行的操作系统架构类型
 * @property {string} desktopPath 用户桌面文件夹路径
 * @property {string} tmpPath 用户临时文件存储路径
 * @property {string} dataPath 用户个人数据文件夹路径
 * @property {string} appPath Electron 应用文件程序夹路径
 * @property {string} appRoot Electron 应用根目录路径
 */
export default {
    arch: process.arch,
    os: isOSX ? 'mac' : isWindowsOS ? 'windows' : OS_PLATFORM,
    isWindowsOS,
    isOSX,
    isLinux,
    dataPath,
    desktopPath,
    tmpPath,
    get appPath() {
        return path.resolve(Remote.app.getAppPath(), '..');
    },
    appRoot: Remote.getGlobal('entryPath'),
    windowName,
};
