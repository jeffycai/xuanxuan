import WS from 'ws';
import crypto from './crypto';
import Status from '../../utils/status';

/**
 * Socket 连接状态管理器
 * @type {Status}
 * @private
 */
const STATUS = new Status({
    CONNECTING: 0, // 连接还没开启。
    OPEN: 1, // 连接已开启并准备好进行通信。
    CLOSING: 2, // 连接正在关闭的过程中。
    CLOSED: 3, // 连接已经关闭，或者连接无法建立。
    UNCONNECT: 4, // 未连接
}, 4);

/**
 * Socket 连接管理类（Electron）
 *
 * @export
 * @class Socket
 */
export default class Socket {
    /**
     * Socket 连接状态管理器
     * @type {Status}
     * @static
     * @memberof Socket
     */
    static STATUS = STATUS;

    /**
     * 创建一个 Socket 类实例
     * @param {string} url Socket 连接地址
     * @param {Object} options Socket 连接选项
     * @memberof Socket
     */
    constructor(url, options) {
        this._status = STATUS.create(STATUS.UNCONNECT);
        this._status.onChange = (newStatus, oldStatus) => {
            if (this.onStatusChange) {
                this.onStatusChange(newStatus, oldStatus);
            }
        };

        if (url) {
            this.init(url, options);
        }
    }

    /**
     * 初始化 Socket 连接
     * @param {string} url Socket 连接地址
     * @param {Object} options Socket 连接选项
     * @return {void}
     */
    init(url, options) {
        // Close socket before init
        this.close();

        options = Object.assign({
            connent: true,
            userToken: '',
            cipherIV: '',
            encryptEnable: true,
        }, options);

        this.options = options;
        this.url = url;
        this._status.change(STATUS.UNCONNECT);

        if (this.onInit) {
            this.onInit();
        }

        if (DEBUG) {
            console.collapse('SOCKET Init', 'indigoBg', this.url, 'indigoPale', this.statusName, this.isConnected ? 'greenPale' : 'orangePale');
            console.trace('socket', this);
            console.groupEnd();
        }

        if (options.connect && this.url) {
            this.connect();
        }
    }

    /**
     * 获取状态值
     * @memberof Member
     * @type {number}
     */
    get status() {
        return this._status.value;
    }

    /**
     * 获取状态名称
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get statusName() {
        return this._status.name;
    }

    /**
     * 设置状态
     * @param {string|number} newStatus 状态值或名称
     * @memberof Member
     */
    set status(newStatus) {
        this._status.change(newStatus);
    }

    /**
     * 获取是否连接成功
     * @memberof Socket
     * @type {boolean}
     */
    get isConnected() {
        return this.isStatus(STATUS.OPEN);
    }

    /**
     * 获取是否正在连接中
     * @memberof Socket
     * @type {boolean}
     */
    get isConnecting() {
        return this.isStatus(STATUS.CONNECTING);
    }

    /**
     * 判断当前状态是否是给定的状态
     * @memberof Member
     * @param {number|string} status 要判断的状态值或状态名称
     * @return {boolean} 如果为 `true` 则为给定的状态，否则不是
     */
    isStatus(status) {
        return this._status.is(status);
    }

    /**
     * 从 WebSocket 实例更新状态信息
     *
     * @memberof Socket
     * @return {void}
     */
    updateStatusFromClient() {
        if (this.client) {
            this.status = this.client.readyState;
        } else {
            this.status = STATUS.UNCONNECT;
        }
    }

    /**
     * 开始连接
     *
     * @memberof Socket
     * @return {void}
     */
    connect() {
        this.close();

        this.status = STATUS.CONNECTING;
        this.client = new WS(this.url, {
            rejectUnauthorized: false,
            headers: {version: this.options.version}
        });

        if (DEBUG) {
            console.collapse('SOCKET Connect', 'indigoBg', this.url, 'indigoPale', this.statusName, this.isConnected ? 'greenPale' : 'orangePale');
            console.log('socket', this);
            console.groupEnd();
        }

        this.client.on('open', this.handleConnect.bind(this));
        this.client.on('message', this.handleData.bind(this));
        this.client.on('close', this.handleClose.bind(this));
        this.client.on('error', this.handleError.bind(this));
        this.client.on('unexpected-response', this.handleError.bind(this));
        this.client.on('pong', this.handlePong.bind(this));
        this.client.on('ping', this.handlePing.bind(this));
    }

    /**
     * 重新连接
     *
     * @return {void}
     * @memberof Socket
     */
    reconnect() {
        return this.connect();
    }

    /**
     * 处理 ping 事件
     * @param {string|Buffer} data ping 数据
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handlePing(data) {
        if (this.onPing) {
            this.onPing(data);
        }

        if (this.options && this.options.onPing) {
            this.options.onPing(this, data);
        }
    }

    /**
     * 处理 pong 事件
     * @param {string|Buffer} data pong 数据
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handlePong(data) {
        if (this.onPong) {
            this.onPong(data);
        }

        if (this.options && this.options.onPong) {
            this.options.onPong(this, data);
        }
    }

    /**
     * 处理连接成功事件
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handleConnect() {
        this.updateStatusFromClient();

        if (DEBUG) {
            console.collapse('SOCKET Connected', 'indigoBg', this.url, 'indigoPale');
            console.log('socket', this);
            console.groupEnd();
        }

        if (this.options.onConnect) {
            this.options.onConnect(this);
        }

        if (this.onConnect) {
            this.onConnect();
        }
    }

    /**
     * 处理连接关闭事件
     *
     * @param {number} code 关闭代码
     * @param {string} reason 关闭原因
     * @memberof Socket
     * @protected
     * @return {void}
     */
    handleClose(code, reason) {
        if (!this.isConnected) {
            this.handleConnectFail({code, message: reason});
        }

        const unexpected = !this._status.is(STATUS.CLOSING);
        this.updateStatusFromClient();
        this.client = null;
        this.status = STATUS.CLOSED;

        if (DEBUG) {
            console.collapse('SOCKET Closed', 'indigoBg', this.url, 'indigoPale');
            console.log('socket', this);
            console.log('code', code);
            console.log('reason', reason);
            console.groupEnd();
        }

        if (this.onClose) {
            this.onClose(code, reason, unexpected);
        }

        if (this.options && this.options.onClose) {
            this.options.onClose(this, code, reason, unexpected);
        }
    }

    /**
     * 处理连接失败事件
     * @param {Event} e 连接失败事件对象
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handleConnectFail(e) {
        if (this.onConnectFail) {
            this.onConnectFail(e);
        }
        if (this.options && this.options.onConnectFail) {
            this.options.onConnectFail(e);
        }
    }

    /**
     * 处理连接发生错误
     *
     * @param {Error} error 连接错误对象
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handleError(error) {
        this.updateStatusFromClient();

        if (DEBUG) {
            console.collapse('SOCKET Error', 'redBg', this.url, 'redPale');
            console.log('socket', this);
            console.log('error', error);
            console.groupEnd();
        }

        if (this.options.onError) {
            this.options.onError(this, error);
        }

        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * 处理接收到数据
     *
     * @param {Buffer|String} rawdata 接收到的数据
     * @param {Options} flags 数据参数
     * @memberof Socket
     * @return {void}
     * @protected
     */
    handleData(rawdata, flags) {
        this.updateStatusFromClient();
        let data = null;
        if (flags && flags.binary) {
            if (this.options.encryptEnable) {
                data = crypto.decrypt(rawdata, this.options.userToken, this.options.cipherIV);
            } else {
                data = rawdata.toString();
            }
        }

        if (this.options.onData) {
            this.options.onData(this, data, flags);
        }

        if (this.onData) {
            this.onData(data, flags);
        }
    }

    /**
     * 通过 Socket 连接向服务器发送数据
     *
     * @param {string|Buffer} rawdata 要发送的数据
     * @param {function} callback 发送完成后的回调函数
     * @memberof Socket
     * @return {void}
     */
    send(rawdata, callback) {
        let data = null;
        if (this.options.encryptEnable) {
            data = crypto.encrypt(rawdata, this.options.userToken, this.options.cipherIV);
            // if (DEBUG) {
            //     console.collapse('ENCRYPT Data', 'blueBg', `length: ${data.length}`, 'bluePale');
            //     console.log('data', data);
            //     console.log('rawdata', rawdata);
            //     console.groupEnd();
            // }
        }

        this.client.send(data, {
            binary: this.options.encryptEnable
        }, callback);
    }

    /**
     * 将连接标记为关闭
     *
     * @memberof Socket
     * @return {void}
     */
    markClose() {
        this.status = STATUS.CLOSING;
    }

    /**
     * 移除所有监听的事件
     * @private
     * @memberof Socket
     * @return {void}
     */
    removeAllListeners() {
        this.client.removeAllListeners();
    }

    /**
     * 关闭 Socket 连接
     * @param {number} code 关闭代码
     * @param {string} reason 关闭原因
     * @return {void}
     */
    close(code, reason) {
        if (this.client) {
            if (reason === 'close' || reason === 'KICKOFF') {
                this.markClose();
            }
            this.removeAllListeners();
            if (reason === true) {
                this.client.terminate();
            } else {
                this.client.close(code || 1000);
            }
            this.handleClose(code, reason);
        }
    }
}
