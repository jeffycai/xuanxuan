import system from 'Config/system.json'; // eslint-disable-line
import media from 'Config/media.json'; // eslint-disable-line
import ui from 'Config/ui.json'; // eslint-disable-line
import lang from 'Config/lang.json'; // eslint-disable-line
import pkg from '../package.json';
import platform from '../platform';

/**
 * 应用运行时配置
 * @type {Object}
 */
const config = {
    system,
    media,
    ui,
    pkg,
    exts: {},
    lang,
};

/**
 * 获取系统特殊版本信息
 * @return {String} 版本信息
 */
export const getSpecialVersionName = () => {
    let {specialVersion} = config.system;
    if (specialVersion === undefined && platform.call('type') === 'browser') {
        specialVersion = 'Modern Browser';
    }
    return specialVersion;
};

/**
 * 更新应用运行时配置
 * @param {Object} newConfig 新的配置项
 * @return {Object} 应用运行时配置
 */
export const updateConfig = (newConfig) => {
    Object.keys(newConfig).forEach(key => {
        Object.assign(config[key], newConfig[key]);
    });
    return config;
};

// 从 package.json 文件中获取额外的运行时配置选项
const {configurations} = pkg;
if (configurations) {
    updateConfig(configurations);
}

// 内置的运行时配置
const buildInConfig = platform.call('buildIn.getBuildInConfig');

// 更新扩展的运行时配置
if (buildInConfig) {
    updateConfig(buildInConfig);
}

export default config;
