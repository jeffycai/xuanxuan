import extractZip from 'extract-zip';
import Path from 'path';
import server, {socket} from '../../core/server';
import {createExtension} from '../extension';
import timeSequence from '../../utils/time-sequence';
import platform from '../../platform';

// 从平台功能访问对象获取功能模块对象
const {fs, net, ui: platformUI} = platform.modules;

/**
 * 服务器扩展变更回调函数
 * @type {function}
 * @private
 */
let onChangeListener = null;

/**
 * 当前登录的用户
 * @type {User}
 * @private
 */
let currentUser = null;

/**
 * 当前登录的用户拥有的服务器扩展列表
 * @type {Extension[]}
 * @private
 */
let exts = null;

/**
 * 是否正在处理服务器扩展
 * @type {boolean}
 * @private
 */
let isProcessing = false;

/**
 * 获取服务器扩展延迟任务 ID
 * @type {number}
 * @private
 */
let nextFetchTask = null;

/**
 * 获取服务器扩展延迟时间，单位毫秒
 * @type {number}
 * @private
 */
const fetchTaskInterval = 1000 * 60 * 60 * 1.5;

/**
 * 检查服务器扩展在本地是否存在
 * @param {Extension} ext 扩展对象
 * @returns {Promise<boolean>} 使用 Promise 异步返回处理结果
 */
const checkLocalCache = ext => {
    return new Promise(resolve => {
        // 检查是否存在本地扩展包目录
        fs.pathExists(ext.localPath).then(isLocalPathExists => {
            if (isLocalPathExists) {
                // 如果本地扩展包目录已经存在则检查 md5 值是否一致
                const md5Obj = fs.readJsonSync(Path.join(ext.localPath, 'md5.json'), {throws: false});
                if (md5Obj && md5Obj.md5 === ext.md5) {
                    return resolve(true);
                } else {
                    fs.emptyDirSync(ext.localPath);
                }
            }
            return resolve(false);
        }).catch(() => (resolve(false)));
    });
};

/**
 * 从服务器下载远程扩展
 * @param {Extension} ext 服务器扩展配置
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
const downloadRemoteExtension = ext => {
    return net.downloadFile(currentUser, {
        url: ext.download,
        path: ext.remoteCachePath,
    }, progress => {
        ext.downloadProgress = progress / 100;
        if (onChangeListener) {
            onChangeListener(ext, 'update');
        }
    }).then(file => {
        if (file.localPath) {
            return new Promise((resolve, reject) => {
                extractZip(file.localPath, {dir: ext.localPath}, err => {
                    fs.removeSync(file.localPath);
                    if (err) {
                        err.code = 'EXT_UNZIP_ERROR';
                        reject(err);
                    } else {
                        fs.outputJsonSync(Path.join(ext.localPath, 'md5.json'), {md5: ext.md5, download: ext.download, downloadTime: new Date().getTime()});
                        resolve(ext);
                    }
                });
            });
        }
        return Promise.reject(new Error(`Cannot download extension package form remote server ${ext.download}.`));
    });
};

/**
 * 加载服务器扩展在本地的 package.json 文件
 * @param {Extension} ext 服务器扩展
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
const loadRemoteExtension = ext => {
    return fs.readJson(Path.join(ext.localPath, 'package.json'), {throws: false});
};

/**
 * 处理服务器推送的远程扩展
 * @return {void}
 */
const processExtensions = async () => {
    if (!exts || !exts.length || isProcessing) {
        return;
    }
    const theExt = exts.find(x => !x.isRemoteLoaded && !x.loadRemoteFailed);
    if (theExt) {
        isProcessing = true;

        try {
            const isLocalCacheOk = await checkLocalCache(theExt);
            if (!isLocalCacheOk) {
                await downloadRemoteExtension(theExt);
            }
            // load package json
            const pkgJson = await loadRemoteExtension(theExt);
            if (pkgJson && pkgJson.name) {
                if (pkgJson.name === theExt.name) {
                    if (DEBUG) {
                        console.warn(`The package name(${pkgJson.name}) is not match the server name(${theExt.name})`);
                    }
                }
                if (onChangeListener) {
                    onChangeListener(theExt, 'remove');
                }
                const findIndex = exts.findIndex(x => x.name === theExt.name);
                theExt.setLoadRemoteResult(pkgJson);
                theExt.delete = true;
                const newExt = createExtension(Object.assign({
                    icon: theExt.icon,
                    serverEntry: theExt.serverEntry
                }, pkgJson, {
                    download: theExt.download,
                    md5: theExt.md5,
                    entryUrl: theExt.entryUrl,
                    entryID: theExt.entryID
                }), theExt.data);
                newExt.hotAttach();
                exts.splice(findIndex, 1, newExt);
                if (onChangeListener) {
                    onChangeListener(newExt, 'add');
                }
            } else {
                theExt.setLoadRemoteResult(false, new Error('Cannot read package.json from ' + theExt.localPath));
            }
        } catch (error) {
            if (DEBUG) {
                console.error('Process remote extension error', error);
            }
            theExt.setLoadRemoteResult(false, error);
        }

        if (!theExt.delete && onChangeListener) {
            onChangeListener(theExt, 'update');
        }

        isProcessing = false;
        processExtensions();
    }
};

/**
 * 获取免登录地址任务清单
 * @type {Object[]}
 * @private
 */
let entryVisitUrlTasks = [];

/**
 * 是否正在执行获取免登录地址任务
 * @type {boolean}
 */
let isRunningEntryVisitTask = false;

/**
 * 从队列中执行获取免登录地址任务，同时可以添加一个新的任务
 * @param {{entryID: string, id: number, referer: string?, resolve: function!, reject: function!}?} newTask 要执行的新任务
 * @return {void}
 */
const runEntryVisitUrlTask = (newTask) => {
    if (newTask) {
        entryVisitUrlTasks.push(newTask);
    }
    if (isRunningEntryVisitTask) {
        return;
    }
    if (entryVisitUrlTasks.length) {
        isRunningEntryVisitTask = true;
        const task = entryVisitUrlTasks[0];
        const onFinishTask = () => {
            const taskIndex = entryVisitUrlTasks.findIndex(x => x.id === task.id);
            if (taskIndex > -1) {
                entryVisitUrlTasks.splice(taskIndex, 1);
            }
            isRunningEntryVisitTask = false;
            if (entryVisitUrlTasks.length) {
                runEntryVisitUrlTask();
            }
        };
        server.socket.sendAndListen({
            module: 'entry',
            method: 'visit',
            params: {entryID: task.entryID, referer: task.referer}
        }).then(url => {
            onFinishTask();
            task.resolve(url);
        }).catch(err => {
            onFinishTask();
            task.reject();
        });
    }
};

/**
 * 获取远程扩展的免登录地址
 * @param {Extension|string} extOrEntryID 远程扩展对象或者远程入口 ID
 * @param {string} [referer=''] 要访问的链接，如果留空则使用远程扩展的主页链接
 * @returns {Promise<string>} 使用 Promise 异步返回处理结果
 */
export const getEntryVisitUrl = (extOrEntryID, referer = '') => {
    return new Promise((resolve, reject) => {
        runEntryVisitUrlTask({
            id: timeSequence(),
            entryID: typeof extOrEntryID === 'object' ? (extOrEntryID.entryID || extOrEntryID.name) : extOrEntryID,
            referer,
            resolve,
            reject
        });
    });
};

/**
 * 处理 Socket 推送的服务器扩展列表消息事件
 * @param {SocketMessage} msg Socket 连接消息
 * @return {void}
 */
const handleChatExtensions = msg => {
    if (currentUser && msg.isSuccess && msg.data.length) {
        const baseUserExtsDir = platformUI.createUserDataPath(currentUser, '', 'extensions');
        msg.data.forEach(item => {
            item = Object.assign({}, item);
            const extPkg = Object.assign(Object.assign(item, {
                icon: item.logo,
                entryUrl: item.entryUrl || item.webViewUrl
            }));
            if (!item.download && item.webViewUrl) {
                extPkg.type = 'app';
                extPkg.appType = 'webView';
                extPkg.webViewUrl = item.webViewUrl;
            }
            const extData = {remote: true, serverData: item.data};
            if (item.download) {
                extData.remoteCachePath = Path.join(baseUserExtsDir, `${item.name}.zip`);
                extData.localPath = Path.join(baseUserExtsDir, item.name);
            } else if (item.webViewUrl) {
                extData.remoteLoaded = true;
            }
            const ext = createExtension(extPkg, extData);
            const findIndex = exts.findIndex(x => x.name === ext.name);
            if (findIndex > -1) {
                exts.splice(findIndex, 1, ext);
            } else {
                exts.splice(0, 0, ext);
            }
        });
        if (onChangeListener) {
            onChangeListener(exts, 'add');
        }
        processExtensions();
    }
};

/**
 * 处理 Socket 推送的入口免登录地址消息事件
 * @param {SocketMessage} msg Socket 连接消息
 * @return {boolean|any} 如果返回 `false`，则表示处理失败，否则返回处理后的数据
 */
const handleEntryVisit = msg => {
    if (currentUser && msg.isSuccess && msg.data) {
        return msg.data;
    }
    return false;
};

// 设置 Socket 消息处理函数
socket.setHandler({
    'chat/extensions': handleChatExtensions,
    'entry/visit': handleEntryVisit
});

/**
 * 卸载已安装的服务器扩展
 * @param {User} user 当前用户
 * @return {void}
 */
export const detachServerExtensions = user => {
    entryVisitUrlTasks = [];
    currentUser = null;
    if (exts) {
        exts.forEach(ext => {
            ext.detach();
        });
        if (onChangeListener) {
            onChangeListener(exts, 'remove');
        }
        exts = null;
    }
};

/**
 * 从服务器获取远程扩展清单并安装服务器扩展
 * @param {User} user 当前用户
 * @return {void}
 */
export const fetchServerExtensions = (user) => {
    if (nextFetchTask) {
        clearTimeout(nextFetchTask);
        nextFetchTask = null;
    }

    if (!user && currentUser) {
        user = currentUser;
    }
    detachServerExtensions();

    if (!user) {
        return;
    }

    if (user.isVersionSupport('remoteExtension')) {
        currentUser = user;
        exts = [];
        socket.send('extensions');
    }

    nextFetchTask = setTimeout(() => {
        if (currentUser) {
            fetchServerExtensions(currentUser);
        }
    }, fetchTaskInterval);
};

/**
 * 设置服务器扩展变更事件回调函数
 * @param {function} listener 回调函数
 * @return {void}
 */
export const setServerOnChangeListener = listener => {
    onChangeListener = listener;
};

export default {
    getEntryVisitUrl,
    fetchServerExtensions,
    setServerOnChangeListener,
    detachServerExtensions
};
