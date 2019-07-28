// eslint-disable-next-line import/no-unresolved
import compareVersions from 'compare-versions';
import pkg from '../../package.json';
import Socket from '../network/socket';
import serverHandlers from './server-handlers';
import {
    onSwapUser, createUser, setCurrentUser, getCurrentUser,
} from '../profile';
import {requestServerInfo} from '../network/api';
import notice from '../notice';
import events from '../events';
import limitTimePromise from '../../utils/limit-time-promise';
import platform from '../../platform';

/**
 * 判定服务器请求超时时间，单位毫秒
 * @type {number}
 * @private
 */
const TIMEOUT = 20 * 1000;

/**
 * 当前 Socket 管理类实例
 * @type {Socket}
 */
export const socket = new Socket();

// 设置默认通话处理函数
socket.setHandler(serverHandlers);

/**
 * 事件表
 * @type {Object<string, string>}
 * @private
 */
const EVENT = {
    login: 'server.user.login',
    loginout: 'server.user.loginout',
};

// 监听切换用户事件，在切换用时关闭以连接的 Socket 连接
onSwapUser(user => {
    socket.close();
});

/**
 * 最小支持的服务器版本
 * @type {number}
 * @private
 */
const MIN_SUPPORT_VERSION = '1.2.0';

/**
 * 检查服务器版本是否受支持
 * @param {string} serverVersion 服务器版本
 * @return {boolean}
 */
const checkServerVersion = serverVersion => {
    if (!serverVersion) {
        return 'SERVER_VERSION_UNKNOWN';
    }
    if (serverVersion[0].toLowerCase() === 'v') {
        serverVersion = serverVersion.substr(1);
    }
    if (compareVersions(serverVersion, MIN_SUPPORT_VERSION) < 0) {
        if (!DEBUG) {
            const error = new Error('SERVER_VERSION_NOT_SUPPORT');
            error.formats = [pkg.version, serverVersion, MIN_SUPPORT_VERSION];
            return error;
        }
        console.warn(`The server version '${serverVersion}' not support, require the min version '${MIN_SUPPORT_VERSION}'.`);
    }
    if (platform.isType('browser') && compareVersions(serverVersion, '1.2.0') < 0) {
        const error = new Error('SERVER_VERSION_NOT_SUPPORT_IN_BROWSER');
        error.formats = [pkg.version, serverVersion, '1.2.0'];
        return error;
    }
    return false;
};

/**
 * 检查用户登录的服务器版本支持情况
 * @param {User} user 当前用户
 * @return {Object<string, boolean>} 返回一个功能支持情况表
 */
const checkVersionSupport = user => {
    const {serverVersion, uploadFileSize} = user;
    const compareVersionValue = compareVersions(serverVersion, '1.3.0');
    const compareVersionValue2 = compareVersions(serverVersion, '1.4.0');
    const compareVersionValue3 = compareVersions(serverVersion, '1.6.0');
    return {
        messageOrder: compareVersionValue >= 0,
        userGetListWithId: compareVersionValue >= 0,
        wss: compareVersionValue > 0,
        fileServer: uploadFileSize !== 0,
        todo: compareVersionValue2 > 0,
        socketPing: compareVersionValue2 > 0,
        remoteExtension: compareVersions(serverVersion, '1.5.0') > 0,
        muteChat: compareVersionValue3 > 0,
        hideChat: compareVersionValue3 > 0,
        changePwdWithMD5: compareVersions(serverVersion, '2.0.0') > 0,
    };
};

/**
 * 登录到服务器
 * @param {Object|User} user 要登录的用户
 * @return {Promise<User, Error>}
 */
export const login = (user) => {
    user = setCurrentUser(createUser(user));

    if (DEBUG) {
        console.collapse('Server.login', 'tealBg', user.identify, 'tealPale');
        console.log('user', user);
        console.groupEnd();
    }
    if (!user) {
        const error = new Error('User is not set.');
        error.code = 'USER_INFO_REQUIRED';
        return Promise.reject(error);
    }
    if (user.isLogging) {
        const error = new Error('Last login request not finish, please wait a minute.');
        error.code = 'SERVER_IS_BUSY';
        return Promise.reject(error);
    }

    // 标记后台登录开始
    user.beginLogin();

    return limitTimePromise(requestServerInfo(user), TIMEOUT).then(user => {
        const versionError = checkServerVersion(user.serverVersion);
        if (versionError) {
            return Promise.reject(versionError);
        }
        user.setVersionSupport(checkVersionSupport(user));
        return socket.login(user, {
            onClose: (_, code, reason, unexpected) => {
                notice.update();
                events.emit(EVENT.loginout, user, code, reason, unexpected);
            }
        });
    }).then(() => {
        user.endLogin(true);
        user.save();
        events.emit(EVENT.login, user);
        return Promise.resolve(user);
    }).catch(error => {
        user.endLogin(false);
        events.emit(EVENT.login, user, error);
        return Promise.reject(error);
    });
};

/**
 * 向服务器请求变更用户状态名称
 * @param {string} status 用户状态名称
 * @return {Promise}
 */
export const changeUserStatus = status => {
    return socket.changeUserStatus(status);
};

/**
 * 绑定用户登录事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onUserLogin = listener => events.on(EVENT.login, listener);

/**
 * 绑定用户退出登录事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onUserLogout = listener => events.on(EVENT.loginout, listener);

/**
 * 向服务器主动请求获取系统用户数据
 * @param {?string} idList 要求请求的用户 ID，多个用户 ID 使用英文逗号拼接，如果不指定 ID 则获取系统所有用户数据
 * @return {Promise}
 */
export const fetchUserList = (idList) => {
    return socket.sendAndListen({
        method: 'usergetlist',
        params: [idList || '']
    });
};

/**
 * 临时用户 ID 表
 * @type {string[]}
 * @private
 */
let tempUserIdList = null;

/**
 * 上次获取临时用户延迟任务标识
 * @type {number}
 * @private
 */
let lastGetTempUserCall = null;

/**
 * 从服务器请求获取临时用户数据
 * @param {number} id 临时用户 ID
 * @return {void}
 */
export const tryGetTempUserInfo = id => {
    if (!lastGetTempUserCall) {
        clearTimeout(lastGetTempUserCall);
    }
    if (tempUserIdList) {
        tempUserIdList.push(id);
    } else {
        tempUserIdList = [id];
    }
    lastGetTempUserCall = setTimeout(() => {
        if (tempUserIdList.length) {
            fetchUserList(tempUserIdList);
            tempUserIdList = [];
        }
        lastGetTempUserCall = null;
    }, 1000);
};

/**
 * 退出登录
 * @return {void}
 */
export const logout = () => {
    notice.update();
    socket.logout();
    const currentUser = getCurrentUser();
    if (currentUser) {
        currentUser.markUnverified();
    }
};

export default {
    login,
    logout,
    socket,
    onUserLogin,
    onUserLogout,
    changeUserStatus,
    fetchUserList,
    tryGetTempUserInfo
};
