// eslint-disable-next-line import/no-unresolved
import md5 from 'md5';
import SocketMessage from './socket-message';
import events from '../events';
import Lang from '../lang';
import Config from '../../config';
import platform from '../../platform';

const Socket = platform.access('Socket');

/**
 * Ping 消息发送间隔，单位毫秒
 * @type {number}
 * @private
 */
const PING_INTERVAL = DEBUG ? (1000 * 60) : (1000 * 60 * 2);

/**
 * 等待消息回应判定为超时的事件，单位毫秒
 * @type {number}
 * @private
 */
const LISTEN_TIMEOUT = 1000 * 15;

/**
 * 事件名称表
 * @type {Object}
 * @private
 */
const EVENT = {
    message: 'app_socket.message',
};

/**
 * 监听消息回应
 * @param {string} moduleName 消息操作模块名称
 * @param {string} methodName 消息操作方法名称
 * @param {number} [timeout=LISTEN_TIMEOUT]
 * @return {Promise}
 * @private
 */
const listenMessage = (moduleName, methodName, timeout = LISTEN_TIMEOUT) => {
    return new Promise((resolve, reject) => {
        let listenHandler = null;
        const listenTimer = setTimeout(() => {
            if (listenHandler) {
                events.off(listenHandler);
            }
            reject();
        }, timeout);
        listenHandler = events.on(EVENT.message, (msg, result) => {
            if (msg.module === moduleName && msg.method === methodName) {
                if (listenTimer) {
                    clearTimeout(listenTimer);
                }
                if (listenHandler) {
                    events.off(listenHandler);
                }
                resolve(result);
            }
        });
    });
};

/**
 * Socket 服务管理类
 *
 * @export
 * @class AppSocket
 * @extends {Socket}
 */
export default class AppSocket extends Socket {
    /**
     * 创建一个 Socket 服务器管理类实例
     * @memberof AppSocket
     */
    constructor() {
        super();

        /**
         * 当前用户
         * @type {User}
         */
        this.user = null;

        /**
         * Ping 消息发送间隔，单位毫秒
         * @type {number}
         */
        this.pingInterval = PING_INTERVAL;

        /**
         * Socket 消息接收处理函数
         * @type {Object<string, Function>}
         */
        this.handlers = {};

        /**
         * ping 循环任务 ID
         * @type {number}
         * @private
         */
        this.pingTask = null;
    }

    /**
     * 发送 SocketMessage
     *
     * @param {Object<string, any>|SocketMessage} msg 要发送的 SocketMessage 实例或者用于创建 SocketMessage 实例的属性对象
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    send(msg) {
        return new Promise((resolve) => {
            msg = SocketMessage.create(msg);
            if (!msg.userID) {
                msg.userID = this.user.id;
            }
            super.send(msg.json, () => {
                if (DEBUG) {
                    console.collapse('Socket Send ⬆︎', 'indigoBg', msg.pathname, 'indigoPale');
                    console.log('msg', msg);
                    console.groupEnd();
                }
                resolve(msg);
            });
        });
    }

    /**
     * 设置 Socket 消息接收处理函数
     * @param {string} moduleName 要处理的操作模块名称
     * @param {string} methodName 要处理的操作方法名称
     * @param {Function(msg: SocketMessage, socket: Socket)} func 处理函数
     * @return {void}
     * @memberof Socket
     */
    setHandler(pathname, func) {
        if (typeof pathname === 'object') {
            Object.keys(pathname).forEach(name => {
                this.handlers[name.toLowerCase()] = pathname[name];
            });
        } else {
            this.handlers[pathname.toLowerCase()] = func;
        }
    }

    /**
     * 获取消息接收处理函数
     * @param {...string} pathnames 操作路径
     * @return {Function(msg: SocketMessage, socket: Socket)}
     * @memberof Socket
     */
    getHandler(...pathnames) {
        const pathname = pathnames.join('/').toLowerCase();
        return this.handlers[pathname];
    }

    /**
     * 使用消息接收处理函数处理接收到的消息
     *
     * @param {SocketMessage} msg 要处理的消息实例
     * @memberof AppSocket
     * @return {void}
     */
    handleMessage(msg) {
        if (DEBUG) {
            console.collapse('SOCKET Data ⬇︎', 'purpleBg', msg.pathname, 'purplePale', msg.isSuccess ? 'OK' : 'FAILED', msg.isSuccess ? 'greenPale' : 'dangerPale');
            console.log('msg', msg);
            console.log('socket', this);
            console.groupEnd();
        }

        let handler = this.getHandler(msg.module, msg.method);
        let result;
        if (handler) {
            while (handler && typeof handler === 'string') {
                handler = this.getHandler(handler);
            }
            if (handler) {
                result = handler(msg, this);
            }
        } else {
            result = msg.data;
        }
        if (result === undefined) {
            result = msg.isSuccess;
        }
        events.emit(EVENT.message, msg, result);
    }

    /**
     * 通过 Socket 发送消息并监听服务器对此消息的回应
     * @param {Object<string, any>|SocketMessage} msg 要发送的 SocketMessage 实例或者用于创建 SocketMessage 实例的属性对象
     * @param {Function(result: any): any} check 用于检查服务器返回结果的函数
     * @return {Promise}
     * @memberof AppSocket
     */
    sendAndListen(msg, check) {
        return new Promise((resolve, reject) => {
            msg = SocketMessage.create(msg);
            listenMessage(msg.module, msg.method).then((result) => {
                if (check) {
                    result = check(result);
                }
                if (result) {
                    resolve(result);
                } else {
                    reject();
                }
                return result;
            }).catch(reject);
            this.send(msg);
        });
    }

    /**
     * 当 Socket 初始化时执行的操作
     * @private
     * @return {void}
     * @memberof AppSocket
     */
    onInit() {
        this.lastHandTime = 0;
        this.lastHandTime = 0;
    }

    /**
     * 当 Socket 关闭时执行的操作
     * @param {number} code 关闭代码
     * @param {string} reason 关闭原因
     * @param {boolean} unexpected 是否是意外关闭
     * @private
     * @return {void}
     * @memberof AppSocket
     */
    onClose(code, reason, unexpected) {
        this.stopPing();
        if (this.user && this.user.isOnline) {
            this.user[unexpected ? 'markDisconnect' : 'markUnverified']();
        }
    }

    /**
     * 当 Socket 接收到数据时执行的操作
     * @param {string} data Socket 接收到的数据（通常是JSON 字符串形式）
     * @param {object} flags 数据标识
     * @private
     * @return {void}
     * @memberof AppSocket
     */
    onData(data, flags) {
        const msg = SocketMessage.fromJSON(data);
        if (!msg) {
            if (DEBUG) {
                console.error('Cannot handle data:', data);
            }
            return;
        }
        this.lastHandTime = new Date().getTime();
        if (Array.isArray(msg)) {
            msg.forEach(x => {
                this.handleMessage(x);
            });
        } else {
            this.handleMessage(msg);
        }
    }

    /**
     * 发起登录请求
     *
     * @param {User} user 当前要进行登录的用户
     * @param {Object<string,any>} options 登录选项
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    login(user, options) {
        this.isLogging = true;
        return new Promise((resolve, reject) => {
            if (user) {
                this.user = user;
            } else {
                // eslint-disable-next-line prefer-destructuring
                user = this.user;
            }
            if (!user) {
                return Promise.reject(new Error('User is not defined.'));
            }
            const onConnect = () => {
                listenMessage('chat', 'login').then((result, msg) => {
                    if (result) {
                        this.startPing();
                        this.syncUserSettings();
                        resolve(user);
                    } else {
                        reject(new Error('Login result is not success.'));
                    }
                    this.isLogging = false;
                    return result;
                }).catch(reject);
                this.send({
                    module: 'chat',
                    method: 'login',
                    params: [
                        user.serverName,
                        user.account,
                        user.passwordForServer,
                        'online'
                    ]
                });
            };
            this.init(user.socketUrl, Object.assign({
                userToken: user.token,
                cipherIV: user.cipherIV,
                version: Config.pkg.version,
                connect: true,
                onConnect,
                onConnectFail: (e) => {
                    reject(e);
                }
            }, options));
        });
    }

    /**
     * 发起退出登录请求
     *
     * @return {void}
     * @memberof AppSocket
     */
    logout() {
        if (this.isConnected) {
            this.uploadUserSettings();
            setTimeout(() => {
                this.markClose();
                this.send('logout');
            }, 500);
        } else {
            this.markClose();
            this.handleClose(null, 'logout');
        }
    }

    /**
     * 发起上传用户个人配置请求
     *
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    uploadUserSettings() {
        const {user} = this;
        const needSaveId = user.config.needSave;
        return this.sendAndListen({
            method: 'settings',
            params: [
                user.account,
                user.config.exportCloud()
            ]
        }).then(() => {
            if (user.config.needSave === needSaveId) {
                user.config.makeSave();
            }
            return user;
        });
    }

    /**
     * 从服务器同步个人配置
     *
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    syncUserSettings() {
        return this.sendAndListen({
            method: 'settings',
            params: [
                this.user.account,
                ''
            ]
        });
    }

    /**
     * 变更当前用户状态
     *
     * @param {string} status 状态名称
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    changeUserStatus(status) {
        return this.changeUser({status});
    }

    /**
     * 变更用户信息
     *
     * @param {Object<string,any>} userChangeData 要变更的属性对象
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    changeUser(userChangeData) {
        userChangeData.account = this.user.account;
        return this.sendAndListen({
            method: 'userchange',
            params: [userChangeData]
        });
    }

    /**
     * 修改用户密码
     *
     * @param {string} password 新的密码
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    changeUserPassword(password) {
        if (this.user.ldap) {
            return Promise.reject(Lang.string('user.changePassword.notSupport'));
        }
        return this.changeUser({
            password: this.user.isVersionSupport('changePwdWithMD5') ? md5(password) : md5(`${md5(password)}${this.user.account}`)
        });
    }

    /**
     * 向服务器发送 ping 消息
     *
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof AppSocket
     */
    ping() {
        const now = new Date().getTime();
        if ((now - this.lastHandTime) > PING_INTERVAL * 2) {
            this.user.markDisconnect();
            this.close(null, 'ping_timeout');
        } else if (!this.handlePing && !this.handlePong && !this.user.isVersionSupport('socketPing')) {
            return this.send('ping');
        }
    }

    /**
     * 停止自动向服务器发送 ping 消息
     *
     * @memberof AppSocket
     * @return {void}
     */
    stopPing() {
        if (this.pingTask) {
            clearInterval(this.pingTask);
            this.pingTask = null;
        }
    }

    /**
     * 处理从服务器接收到的 ping 消息
     *
     * @memberof AppSocket
     * @return {void}
     * @private
     */
    onPing() {
        const now = new Date().getTime();
        if (DEBUG) {
            console.color('SOCKET Ping ⬇︎', 'purpleBg', 'OK', 'greenPale', `${(now - this.lastHandTime) / 1000} seconds`, 'muted');
        }
        this.lastHandTime = new Date().getTime();
    }

    /**
     * 处理从服务器接收到的 pong 消息
     *
     * @memberof AppSocket
     * @return {void}
     * @private
     */
    onPong() {
        this.onPing();
    }

    /**
     * 开始自动向服务器发送 ping 消息
     *
     * @memberof AppSocket
     * @return {void}
     */
    startPing() {
        this.stopPing();
        if (this.isConnected) {
            this.pingTask = setInterval(() => {
                const now = new Date().getTime();
                if (now - this.lastHandTime > this.pingInterval) {
                    this.ping();
                }
            }, this.pingInterval / 2);
        } else if (DEBUG) {
            console.error('Start ping fail, because the socket connection is not opened.');
        }
    }
}
