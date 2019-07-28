import path from 'path';
import fse from 'fs-extra';
import env from './env';

/**
 * 内置扩展存储根路径
 * @type {string}
 */
export const buildInPath = path.join(process.env.HOT ? env.appRoot : env.appPath, 'build-in');

/**
 * 获取内置运行时配置
 * @return {Object} 运行时配置对象
 */
export const getBuildInConfig = () => {
    // 内置扩展存储根路径内的运行时配置文件路径
    const buildInConfigFile = path.join(buildInPath, 'config.json');

    return fse.readJsonSync(buildInConfigFile, {throws: false});
};

/**
 * 获取内置扩展清单
 * @return {Object[]} 获取内置扩展对象列表，如果为 null 则表示没有内置扩展
 */
export const getBuildInExtensions = () => {
    // 内置扩展清单文件路径：`extensions.json`
    const extensionFile = path.join(buildInPath, 'extensions.json');

    // 内置扩展清单文件读取的内置扩展列表
    return fse.readJsonSync(extensionFile, {throws: false});
};

export default {
    buildInPath,
    getBuildInConfig,
    getBuildInExtensions,
};
