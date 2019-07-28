import Config from '../../config';
import Lang from '../lang';
import platform from '../../platform';

/**
 * 平台提供的网络功能访问对象
 * @type {Object}
 * @private
 */
const platformNetwork = platform.access('net');

/**
 * 登录前向 XXD 服务器请求获取服务器信息
 * @param {User} user 当前登录的用户
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const requestServerInfo = user => {
    const postData = JSON.stringify({
        module: 'chat',
        method: 'login',
        params: [
            user.serverName,
            user.account,
            user.passwordForServer,
            ''
        ],
        v: Config.pkg.version,
        lang: Lang.name,
    });
    return platformNetwork.postJSON(user.webServerInfoUrl, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        body: `data=${postData}`
    }).then(data => {
        if (data) {
            user.socketPort = data.chatPort;
            user.token = data.token;
            user.serverVersion = data.version;
            user.socketUrl = data.socketUrl;
            user.uploadFileSize = data.uploadFileSize;
            user.ranzhiUrl = data.ranzhiUrl;
            return Promise.resolve(user);
        }
        const error = new Error('Empty serverInfo data');
        error.code = 'WRONG_DATA';
        return Promise.reject(error);
    });
};

/**
 * 检查上传的文件大小是否符合要求
 * @param {User} user 当前用户
 * @param {number} size 文件大小
 * @return {boolean} 如果为 `true` 则符合要求，否则不符合要求
 */
export const checkUploadFileSize = (user, size) => {
    if (typeof size === 'object') {
        // eslint-disable-next-line prefer-destructuring
        size = size.size;
    }
    const {uploadFileSize} = user;
    return uploadFileSize && size <= uploadFileSize;
};

/**
 * 获取然之服务器信息
 * @param {User} user 当前用户
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const getRanzhiServerInfo = (user) => {
    const {ranzhiUrl} = user;
    if (ranzhiUrl) {
        return platformNetwork.getJSON(`${ranzhiUrl}/index.php?mode=getconfig`).then(json => {
            if (json && json.version) {
                json.url = ranzhiUrl;
                json.isPathInfo = json.requestType.toUpperCase() === 'PATH_INFO';
                return Promise.resolve(json);
            }
            return Promise.reject(new Error('WRONG_DATA'));
        });
    }
    return Promise.reject(new Error('RANZHI_SERVER_NOTSET'));
};

export default {
    downloadFile: platformNetwork.downloadFile,
    uploadFile: platformNetwork.uploadFile,
    checkFileCache: platformNetwork.checkFileCache || (() => false)
};
