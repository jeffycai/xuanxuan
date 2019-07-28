import Path from 'path';
import compareVersions from 'compare-versions';
import uuid from 'uuid/v4';
import extractZip from 'extract-zip';
import db, {
    removeInstalledExtension, saveInstalledExtension, getInstalledExtension, saveExtensionData,
} from './extensions-db';
import {createExtension} from './extension';
import Modal from '../components/modal';
import Lang from '../core/lang';
import platform from '../platform';

/**
 * 平台提供的对话框功能访问对象
 * @type {Object}
 * @private
 */
const dialog = platform.access('dialog');

/**
 * 平台提供的系统环境信息访问对象
 * @type {Object}
 * @private
 */
const env = platform.access('env');

/**
 * 平台提供的文件读写功能访问对象
 * @type {Object}
 * @private
 */
const fse = platform.access('fs');

/**
 * 生成扩展本地保存路径
 * @param {Extension} extension 扩展
 * @return {string} 扩展本地保存路径
 */
export const createExtensionSavePath = extension => {
    return extension.localPath || Path.join(env.dataPath, 'xexts', extension.name);
};

/**
 * 卸载扩展
 * @param {Extension} extension 要卸载的扩展
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const uninstallExtension = extension => {
    return removeInstalledExtension(extension).then(() => {
        extension.detach();
        if (extension.isDev) {
            return Promise.resolve();
        }
        const savedPath = createExtensionSavePath(extension);
        return fse.remove(savedPath);
    });
};

/**
 * 解压扩展压缩文件
 * @param {string} filePath 扩展压缩文件路径
 * @returns {Promise} 使用 Promise 异步返回处理结果
 * @private
 */
const extractInstallFile = filePath => {
    return new Promise((resolve, reject) => {
        const tmpPath = Path.join(env.tmpPath, uuid());
        extractZip(filePath, {dir: tmpPath}, err => {
            if (err) {
                err.code = 'EXT_UNZIP_ERROR';
                reject(err);
            } else {
                resolve(tmpPath);
            }
        });
    });
};

/**
 * 安装扩展，并尝试进行热加载
 * @param {Extension} extension 要加载的扩展
 * @param {boolean} [override=true] 是否覆盖数据库中已有的扩展
 * @param {boolean} [tryHotAttach=true] 是否安装后尝试进行热加载
 * @returns {Promise} 使用 Promise 异步返回处理结果
 * @private
 */
const saveAndAttach = (extension, override = true, tryHotAttach = true) => {
    return saveInstalledExtension(extension, override, tryHotAttach ? ext => {
        ext.hotAttach();
    } : null);
};

/**
 * 安装扩展
 * @param {Extension} extension 要加载的扩展
 * @param {boolean} [override=true] 是否覆盖数据库中已有的扩展
 * @returns {Promise} 使用 Promise 异步返回处理结果
 * @private
 */
const saveExtension = (extension, override = true) => {
    return saveAndAttach(extension, override, false);
};

/**
 * 重新加载正在开发的扩展
 * @param {Extension} extension 要重新加载的扩展
 * @returns {boolean|Extension} 如果返回 `Extension` 实例则操作成功，否则操作失败
 */
export const reloadDevExtension = extension => {
    const path = extension.localPath;
    if (extension.isModuleLoaded) {
        extension.detach();
    }
    if (path) {
        const pkgFilePath = Path.join(path, 'package.json');
        const pkg = fse.readJSONSync(pkgFilePath, {throws: false});
        if (pkg) {
            extension = createExtension(pkg, extension.data);
            saveAndAttach(extension);
            if (DEBUG) {
                console.collapse('Extension Reload for Dev', 'greenBg', extension.name, 'greenPale');
                console.log('extension', extension);
                console.groupEnd();
            }
            return extension;
        }
    }
    return false;
};

/**
 * 从指定目录安装扩展
 * @param {string} dir 扩展目录
 * @param {boolean} [deleteDir=false] 是否在安装完成后删除扩展目录
 * @param {boolean} [devMode=false] 是否是开发模式
 * @returns {Promise} 使用 Promise 异步返回处理结果
 * @private
 */
const installFromDir = (dir, deleteDir = false, devMode = false) => {
    const pkgFilePath = Path.join(dir, 'package.json');
    let extension = null;
    return fse.readJSON(pkgFilePath).then(pkg => {
        extension = createExtension(pkg, {
            isDev: devMode
        });
        const savedPath = devMode ? dir : createExtensionSavePath(extension);
        extension.localPath = savedPath;
        if (extension.hasModule) {
            return Modal.confirm(Lang.format('exts.installWarning', extension.displayName), {
                actions: [{label: Lang.string('exts.continuneInsatll'), type: 'submit'}, {type: 'cancel'}]
            }).then(confirmed => {
                if (confirmed) {
                    return Promise.resolve(extension);
                }
                return Promise.reject();
            });
        }
        return Promise.resolve(extension);
    }).then(() => {
        const dbExt = getInstalledExtension(extension.name);
        if (dbExt) {
            if (dbExt.version && extension.version && compareVersions(dbExt.version, extension.version) < 0) {
                return Modal.confirm(Lang.format('ext.updateInstall.format', dbExt.displayName, dbExt.version, extension.version)).then(confirmed => {
                    if (confirmed) {
                        return saveExtension(extension);
                    }
                    return Promise.reject();
                });
            }
            return Modal.confirm(Lang.format('ext.overrideInstall.format', dbExt.displayName, dbExt.version || '*', extension.displayName, extension.version || '*')).then(confirmed => {
                if (confirmed) {
                    return saveExtension(extension);
                }
                return Promise.reject();
            });
        }
        return saveExtension(extension, false);
    }).then(() => {
        if (!devMode) {
            return fse.emptyDir(extension.localPath).then(() => {
                return fse.copy(dir, extension.localPath);
            });
        }
        return Promise.resolve(extension);
    }).then(() => {
        if (deleteDir) {
            return fse.remove(dir).then(() => {
                return Promise.resolve(extension);
            });
        }
        saveExtension(extension, true);
        return Promise.resolve(extension);
    }).catch(error => {
        if (deleteDir) {
            return fse.remove(dir).then(() => {
                return Promise.reject(error);
            });
        }
        return Promise.reject(error);
    });
};

/**
 * 从扩展开发目录加载开发中的扩展
 * @param {string} dir 扩展开发目录
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const installExtensionFromDevDir = (dir) => {
    return installFromDir(dir, false, true);
};

/**
 * 从扩展压缩包文件安装扩展，支持 `.zip` 文件和 `.xext` 文件
 * @param {string} filePath 扩展压缩包文件路径
 * @param {boolean} [deleteFile=false] 是否在安装完成后删除扩展压缩包文件
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const installExtensionFromFile = (filePath, deleteFile = false) => {
    return extractInstallFile(filePath).then(tmpPath => {
        if (deleteFile) {
            fse.removeSync(filePath);
        }
        return installFromDir(tmpPath, true);
    });
};

/**
 * 打开一个路径选择对话框从用户选择的路径安装扩展，支持从扩展压缩包文件（.zip 或 .xext）或 `package.json` 文件进行安装
 * 如果启用开发模式安装，则必须选择开发目录内的 `package.json` 文件进行安装
 * @param {function} callback 安装完成后的回调函数
 * @param {boolean} [devMode=false] 是否是开发模式
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const openInstallExtensionDialog = (callback, devMode = false) => {
    dialog.showOpenDialog(devMode ? '.json' : '.xext,.zip', files => {
        if (files && files.length) {
            const filePath = files[0].path;
            const extName = Path.extname(filePath).toLowerCase();
            if (extName === '.json' && Path.basename(filePath) === 'package.json') {
                installFromDir(Path.dirname(filePath), false, devMode).then(extension => {
                    if (callback) {
                        callback(extension);
                    }
                }).catch(error => {
                    if (callback) {
                        callback(false, error);
                    }
                });
            } else if (extName === '.xext' || extName === '.zip') {
                installExtensionFromFile(filePath).then(extension => {
                    if (callback) {
                        callback(extension);
                    }
                }).catch(error => {
                    if (callback) {
                        callback(false, error);
                    }
                });
            } else {
                if (callback) {
                    callback(false, 'EXT_NOT_EXT_SOURCE');
                }
            }
        } else {
            if (callback) {
                callback(false);
            }
        }
    });
};

/**
 * 加载扩展的 `README.md` 文件
 * @param {Extension} extension 扩展
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const loadExtensionReadmeFile = extension => {
    const filePath = Path.join(createExtensionSavePath(extension), 'README.md');
    return fse.readFile(filePath, 'utf8');
};

/**
 * 启用或禁用扩展
 * @param {Extension} extension 要设置的扩展对象
 * @param {boolean} [disabled=true] 如果为 true，则启用扩展，否则禁用扩展
 * @return {void}
 */
export const setExtensionDisabled = (extension, disabled = true) => {
    disabled = !!disabled;
    if (extension.disabled !== disabled) {
        if (disabled) {
            extension.detach();
            extension.disabled = true;
        } else {
            extension.disabled = false;
            extension.hotAttach();
        }
    }
    saveExtensionData(extension);
};

/**
 * 启用扩展
 *
 * @param {Extension} extension 要启用的扩展对象
 * @return {void}
 */
export const setExtensionEnabled = extension => {
    return setExtensionDisabled(extension, false);
};

export {saveExtensionData};

export default {
    db,
    createSavePath: createExtensionSavePath,
    uninstall: uninstallExtension,
    installExtensionFromFile,
    openInstallDialog: openInstallExtensionDialog,
    loadReadmeMarkdown: loadExtensionReadmeFile,
    installFromDevDir: installExtensionFromDevDir,
    reloadDevExtension,
    setExtensionDisabled,
    setExtensionEnabled
};
