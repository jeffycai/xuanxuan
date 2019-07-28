// eslint-disable-next-line import/no-unresolved
import Md5 from 'md5';
import Member from '../models/member';
import UserConfig from './user-config';
import DelayAction from '../../utils/delay-action';
import {isSameDay, isToday} from '../../utils/date-helper';
import events from '../events';
import Config from '../../config';
import {saveUserToStore} from './user-store';

/**
 * 用户密码 MD5 存储前缀
 * @type {string}
 * @private
 */
const PASSWORD_WITH_MD5_FLAG = '%%%PWD_FLAG%%% ';

/**
 * 事件表
 * @type {Object<string, string>}
 * @private
 */
const EVENT = {
    config_change: 'user.config.change',
    status_change: 'user.status.change',
    reconnect: 'user.reconnect',
};

/**
 * 检查用户密码字符串是否包含 MD5 存储前缀
 * @param {string} password 用户密码
 * @return {boolean} 如果为 `true` 表示给定的密码字符串包含 MD5 存储前缀，否则不是
 */
export const isPasswordWithMD5Flag = password => password && password.startsWith(PASSWORD_WITH_MD5_FLAG);

/**
 * 用户类
 *
 * @class User
 * @extends {Member}
 */
export default class User extends Member {
    /**
     * 事件表
     * @type {Object<string, string>}
     * @static
     * @memberof User
     */
    static EVENT = EVENT;

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof User
     */
    static SCHEMA = Member.SCHEMA.extend({
        lastLoginTime: {type: 'timestamp'},
        config: {type: 'object', defaultValue: {}},
        password: {type: 'string'},
        token: {type: 'string'},
        cipherIV: {type: 'string'},
        server: {type: 'string'},
        serverVersion: {type: 'string'},
        uploadFileSize: {type: 'int'},
        autoLogin: {type: 'boolean', default: false},
        rememberPassword: {type: 'boolean', default: true},
        signed: {
            type: 'timestamp',
            setter: (time, obj) => {
                const lastSignedTime = obj.signed;
                obj._isFirstSignedToday = time && isToday(time) && (!lastSignedTime || !isSameDay(time, lastSignedTime));
                return time;
            }
        },
    });

    /**
     * 用户状态管理器
     *
     * @type {Status}
     * @static
     * @memberof User
     */
    static STATUS = Member.STATUS;

    /**
     * 创建一个用户类实例
     * @param {Object<string, any>} data 属性对象
     * @memberof User
     */
    constructor(data) {
        super(data);

        /**
         * 用户保存延迟操作管理器
         * @type {DelayAction}
         * @private
         */
        this.saveUserAction = new DelayAction(() => {
            saveUserToStore(this);
        });

        /**
         * 事件机制是否可用
         * @private
         * @type {boolean}
         */
        this.eventsEnable = false;

        this._status.onChange = (status, oldStatus) => {
            if (this.isEventsEnable) {
                events.emit(EVENT.status_change, status, oldStatus, this);
            }

            clearTimeout(this.statusChangeCallTimer);
            if (this._status.is(Member.STATUS.logined)) {
                this.$set('lastLoginTime', new Date().getTime());
                this.statusChangeCallTimer = setTimeout(() => {
                    this.status = Member.STATUS.online;
                }, 1000);
            }
        };
    }


    /**
     * 获取用户类数据库存储实体属性结构管理器
     *
     * @readonly
     * @memberof User
     * @type {EntitySchema}
     */
    // eslint-disable-next-line class-methods-use-this
    get schema() {
        return User.SCHEMA;
    }

    /**
     * 判定当前用户事件机制是否可用
     *
     * @readonly
     * @memberof User
     * @type {boolean}
     */
    get isEventsEnable() {
        return this.eventsEnable;
    }

    /**
     * 将当前用户事件机制标记为可用
     *
     * @memberof User
     * @return {void}
     */
    enableEvents() {
        this.eventsEnable = true;
    }

    /**
     * 销毁当前用户实例，并将当前用户事件机制标记为不可用
     *
     * @memberof User
     * @return {void}
     */
    destroy() {
        this.eventsEnable = false;
    }

    /**
     * 获取当前用户实例存储数据对象
     *
     * @return {Object<string, any>} 数据对象
     * @memberof User
     */
    plain() {
        return Object.assign({}, this.$, {
            config: this.config.plain()
        });
    }

    /**
     * 将用户保存到本地存储
     *
     * @memberof User
     * @return {void}
     */
    save() {
        this.saveUserAction.do();
    }

    /**
     * 判定用户是否在今天第一次进行登录
     *
     * @readonly
     * @memberof User
     * @type {boolean}
     */
    get isFirstSignedToday() {
        return !!this._isFirstSignedToday;
    }

    /**
     * 判定用户是否成功登录过
     *
     * @memberof User
     * @type {boolean}
     */
    get signed() {
        return this.$get('signed');
    }

    /**
     * 设置用户上次登录时间
     *
     * @memberof User
     * @param {number} time 上次登录时间戳
     */
    set signed(time) {
        return this.$set('signed', time);
    }

    /**
     * 获取用户个人配置数据
     *
     * @readonly
     * @memberof User
     * @return {Object<string, any>} 配置数据对象
     */
    get config() {
        if (!this._config) {
            this._config = new UserConfig(this.$get('config'));
            this._config.onChange = (change, config) => {
                // Save user to config file
                this.save();

                // Emit user config change event
                if (this.isEventsEnable) {
                    events.emit(EVENT.config_change, change, config, this);
                }
            };
        }
        return this._config;
    }

    /**
     * 判断用户状态是否处于离线状态
     *
     * @readonly
     * @memberof User
     * @return {boolean} 如果为 `true` 则表示用户处于离线状态，否则为为通过验证或在线状态
     */
    get isDisconnect() {
        return this._status.is(Member.STATUS.disconnect);
    }

    /**
     * 判断用户状态是否处于未通过验证状态
     *
     * @readonly
     * @memberof User
     * @return {boolean} 如果为 `true` 则表示用户处于未通过验证状态
     */
    get isUnverified() {
        return this.status <= Member.STATUS.unverified;
    }

    /**
     * 判断用户状态是否处于已通过验证状态
     *
     * @readonly
     * @memberof User
     * @return {boolean}
     */
    get isVertified() {
        return this.status >= Member.STATUS.disconnect;
    }

    /**
     * 判断用户状态是否处于已登录状态
     *
     * @readonly
     * @memberof User
     * @return {boolean}
     */
    get isLogined() {
        return this.status >= Member.STATUS.logined;
    }

    /**
     * 将用户登录状态设置为离线状态
     *
     * @memberof User
     * @return {void}
     */
    markDisconnect() {
        this.status = Member.STATUS.disconnect;
    }

    /**
     * 将用户登录状态设置为未通过验证状态
     *
     * @memberof User
     * @return {void}
     */
    markUnverified() {
        this.status = Member.STATUS.unverified;
    }

    /**
     * 判断用户状态是否处于正在登录中状态
     *
     * @readonly
     * @memberof User
     * @return {boolean}
     */
    get isLogging() {
        return this._isLogging;
    }

    /**
     * 标记用户正在开始登录操作
     *
     * @memberof User
     * @return {void}
     */
    beginLogin() {
        this._isLogging = true;
    }

    /**
     * 标记用户已结束登录操作
     *
     * @param {boolean} result 是否登录成功
     * @memberof User
     * @return {void}
     */
    endLogin(result) {
        this._isLogging = false;
        if (result) {
            this.status = Member.STATUS.logined;
        } else if (!this.isDisconnect) {
            this.status = Member.STATUS.unverified;
        }
    }

    /**
     * 获取用户可用的 Session ID
     *
     * @memberof User
     * @type {string}
     */
    get sessionID() {
        return this._sessionID;
    }

    /**
     * 设置用户可用的 Session ID
     *
     * @param {string} sessionID Session ID
     * @memberof User
     */
    set sessionID(sessionID) {
        this._sessionID = sessionID;
    }

    /**
     * 设置用户登录的服务器地址
     *
     * @memberof User
     * @param {string} server 服务器地址
     */
    set server(server) {
        if (server) {
            if (!server.startsWith('https://') && !server.startsWith('http://')) {
                server = `https://${server}`;
            }
            const url = new URL(server);
            if (!url.port) {
                url.port = 11443;
            }
            this.$set('server', url.toString());
            this._server = url;
        }
    }

    /**
     * 获取用户登录的服务器地址（以 URL 实例形式）
     *
     * @type {URL}
     * @memberof User
     */
    get server() {
        if (!this._server) {
            this.server = this.$get('server');
        }
        return this._server;
    }

    /**
     * 获取用户登录的服务器地址（以字符串形式）
     *
     * @readonly
     * @memberof User
     * @type {string}
     */
    get serverUrl() {
        const {server} = this;
        return server && server.toString();
    }

    /**
     * 获取然之服务器地址
     *
     * @memberof User
     * @type {string}
     */
    get ranzhiUrl() {
        if (this._ranzhiUrl === undefined) {
            this._ranzhiUrl = this.$get('ranzhiUrl') || `http://${this.server.hostname}`;
        }
        return this._ranzhiUrl;
    }

    /**
     * 设置然之服务器地址
     *
     * @memberof User
     * @param {string} url 然之服务器地址
     */
    set ranzhiUrl(url) {
        this._ranzhiUrl = url;
    }

    /**
     * 获取 XXD 服务器端口号
     *
     * @readonly
     * @memberof User
     * @type {string}
     */
    get webServerPort() {
        const {server} = this;
        return server ? server.port : '';
    }

    /**
     * 获取要登录的 XXD 服务器名称
     *
     * @readonly
     * @memberof User
     * @type {string}
     */
    get serverName() {
        const {server} = this;
        if (server) {
            // eslint-disable-next-line no-nested-ternary
            return server.username ? server.username : (server.pathname ? server.pathname.substr(1) : '');
        }
        return '';
    }

    /**
     * 获取请求 XXD 服务器信息 URL 地址
     *
     * @readonly
     * @memberof User
     * @type {string}
     */
    get webServerInfoUrl() {
        const {server} = this;
        return server ? `${server.origin}/serverInfo` : '';
    }

    /**
     * 获取 Socket 服务器端口
     *
     * @memberof User
     * @type {string}
     */
    get socketPort() {
        return this._socketPort || '';
    }

    /**
     * 设置 Socket 服务器端口
     *
     * @memberof User
     */
    set socketPort(port) {
        this._socketPort = port;
    }

    /**
     * 获取 Socket 服务连接地址
     *
     * @memberof User
     * @type {string}
     */
    get socketUrl() {
        if (this._socketUrl) {
            return this._socketUrl;
        }
        const {serverUrl} = this;
        if (serverUrl) {
            const url = new URL(serverUrl);
            url.protocol = (this.isVersionSupport('wss') && url.protocol === 'https:') ? 'wss:' : 'ws:';
            url.pathname = '/ws';
            url.port = this.socketPort;
            return url.toString();
        }
        return '';
    }

    /**
     * 设置Socket 服务器连接地址
     *
     * @param {string} url Socket 服务器连接地址
     * @memberof User
     */
    set socketUrl(url) {
        this._socketUrl = url;
    }

    /**
     * 获取服务器版本
     *
     * @memberof User
     * @type {string}
     */
    get serverVersion() {
        return this._serverVersion;
    }

    /**
     * 设置服务器版本号
     *
     * @param {string} version 服务器版本号
     * @memberof User
     */
    set serverVersion(version) {
        version = version.toLowerCase();
        if (version[0] === 'v') {
            version = version.substr(1);
        }
        this._serverVersion = version;
    }

    /**
     * 获取服务器地址根路径
     *
     * @memberof User
     * @type {string}
     */
    get serverUrlRoot() {
        const {serverUrl} = this;
        let urlRoot = '';
        if (serverUrl) {
            const url = new URL(serverUrl);
            url.hash = '';
            url.search = '';
            url.pathname = '';
            urlRoot = url.toString();
        }
        if (urlRoot && !urlRoot.endsWith('/')) {
            urlRoot += '/';
        }
        return urlRoot;
    }

    /**
     * 拼接 http 服务器请求地址
     * @param {string} [path=''] 请求路径
     * @memberof User
     * @return {void}
     */
    makeServerUrl(path = '') {
        if (path && path.startsWith('/')) {
            path = path.substr(1);
        }
        return this.serverUrlRoot + path;
    }

    /**
     * 获取上传文件请求地址
     *
     * @memberof User
     * @type {string}
     */
    get uploadUrl() {
        return this.makeServerUrl('upload');
    }

    /**
     * 获取用户标识字符串
     *
     * @memberof User
     * @type {string}
     */
    get identify() {
        const {server} = this;
        if (!server) {
            return '';
        }
        return User.createIdentify(server, this.account);
    }

    /**
     * 获取 Socket 加密 Token 字符串
     *
     * @memberof User
     * @type {string}
     */
    get token() {
        return this.$get('token');
    }

    /**
     * 设置 Socket 加密 Token 字符串
     *
     * @param {string} token  Socket 加密 Token 字符串
     * @memberof User
     */
    set token(token) {
        this.$set('token', token);
    }

    /**
     * 获取 Socket 服务 AES 加密向量
     *
     * @memberof User
     * @type {string}
     */
    get cipherIV() {
        return this.token.substr(0, 16);
        // let cipherIV = this.$get('cipherIV');
        // if(!cipherIV) {
        //     cipherIV = this.token.substr(0, 16);
        // }
        // return cipherIV;
    }

    /**
     * 设置 Socket 服务 AES 加密向量
     *
     * @memberof User
     * @param {string} cipherIV Socket 服务 AES 加密向量
     */
    set cipherIV(cipherIV) {
        this.$set('cipherIV', cipherIV);
    }

    /**
     * 获取最大允许文件上传大小
     *
     * @memberof User
     * @type {number}
     */
    get uploadFileSize() {
        return this.$get('uploadFileSize');
    }

    /**
     * 设置最大允许文件上传大小
     *
     * @param {number} uploadFileSize 最大允许文件上传大小
     * @memberof User
     */
    set uploadFileSize(uploadFileSize) {
        this.$set('uploadFileSize', uploadFileSize);
    }

    /**
     * 获取上次登录的时间戳
     *
     * @memberof User
     * @type {number}
     * @readonly
     */
    get lastLoginTime() {
        return this.$get('lastLoginTime');
    }

    /**
     * 获取是否已设置为自动登录
     *
     * @memberof User
     * @type {boolean}
     */
    get autoLogin() {
        return this.$get('autoLogin');
    }

    /**
     * 设置是否已设置为自动登录
     *
     * @param {boolean} autoLogin 是否已设置为自动登录
     * @memberof User
     */
    set autoLogin(autoLogin) {
        this.$set('autoLogin', autoLogin);
    }

    /**
     * 获取是否设置为记住密码
     *
     * @memberof User
     * @type {boolean}
     */
    get rememberPassword() {
        return this.$get('rememberPassword');
    }

    /**
     * 设置是否设置为记住密码
     *
     * @param {boolean} rememberPassword 是否设置为记住密码
     * @memberof User
     */
    set rememberPassword(rememberPassword) {
        this.$set('rememberPassword', rememberPassword);
    }

    /**
     * 获取是否开启 LDAP 登录模式
     *
     * @memberof User
     * @type {boolean}
     */
    get ldap() {
        if (!Config.ui['login.ldap']) {
            return false;
        }
        return this.$get('ldap');
    }

    /**
     * 设置是否开启 LDAP 登录模式
     *
     * @param {boolean} ldap 是否开启 LDAP 登录模式
     * @memberof User
     */
    set ldap(ldap) {
        this.$set('ldap', ldap);
    }

    /**
     * 获取用户头像图片地址
     *
     * @memberof User
     * @type {string}
     */
    get avatar() {
        let avatar = this._avatar;
        if (!avatar) {
            avatar = this.$get('avatar');
            if (avatar) {
                if (!avatar.startsWith('https://') && !avatar.startsWith('http://')) {
                    avatar = this.serverUrlRoot + avatar;
                }
            }
        }
        return avatar;
    }

    /**
     * 设置用户头像图片地址
     *
     * @param {string} newAvatar 用户头像图片地址
     * @memberof User
     */
    set avatar(newAvatar) {
        this._avatar = null;
        this.$set('avatar', newAvatar);
    }

    /**
     * 获取是否从没有成功登录过
     *
     * @memberof User
     * @type {boolean}
     * @readonly
     */
    get isNeverLogined() {
        return !this.lastLoginTime;
    }

    /**
     * 获取用户密码
     *
     * @memberof User
     * @type {string}
     */
    get password() {
        return this.$get('password');
    }

    /**
     * 获取包含 MD5 前缀的密码
     *
     * @memberof User
     * @type {string}
     */
    get passwordMD5WithFlag() {
        let {password} = this;
        if (password && !isPasswordWithMD5Flag(password)) {
            password = PASSWORD_WITH_MD5_FLAG + password;
        }
        return password;
    }

    /**
     * 获取用于登录验证的密码
     *
     * @memberof User
     * @type {string}
     * @readonly
     */
    get passwordForServer() {
        return this.ldap ? this.password : this.passwordMD5;
    }

    /**
     * 获取 MD5 算法加密后的密码
     *
     * @memberof User
     * @type {string}
     * @readonly
     */
    get passwordMD5() {
        let {password} = this;
        if (isPasswordWithMD5Flag(password)) {
            password = password.substr(PASSWORD_WITH_MD5_FLAG.length);
        } else {
            password = Md5(password);
        }
        return password;
    }

    /**
     * 设置用户密码，支持设置原始密码或者已添加 MD5 前缀的加密后的密码
     *
     * @param {string} newPassword 用户密码，支持设置原始密码或者已添加 MD5 前缀的加密后的密码
     * @memberof User
     */
    set password(newPassword) {
        if (!this.ldap && newPassword && !isPasswordWithMD5Flag(newPassword)) {
            newPassword = PASSWORD_WITH_MD5_FLAG + Md5(newPassword);
        }
        this.$set('password', newPassword);
    }

    /**
     * 检查当前版本是否支持特定功能
     *
     * @param {string} name 功能名称
     * @return {boolean}
     * @memberof User
     */
    isVersionSupport(name) {
        return this._versionSupport && this._versionSupport[name];
    }

    /**
     * 设置当前服务器版本支持的功能表
     *
     * @param {Object<string, boolean>} flags 支持的功能表
     * @memberof User
     */
    setVersionSupport(flags) {
        if (flags) {
            if (!this._versionSupport) {
                this._versionSupport = {};
            }
            Object.assign(this._versionSupport, flags);
        }
    }

    /**
     * 创建一个用户实例
     *
     * @static
     * @param {Object|User} user 用户数据对象
     * @return {User}
     * @memberof User
     */
    static create(user) {
        if (user instanceof User) {
            return user;
        }
        return new User(user);
    }

    /**
     * 创建用户唯一识别标识字符串
     *
     * @static
     * @param {string} server 用户登录的服务器地址
     * @param {string} account 用户账号
     * @return {string}
     * @memberof User
     */
    static createIdentify(server, account) {
        if (!(server instanceof URL)) {
            if (!server.startsWith('https://') && !server.startsWith('http://')) {
                server = `https://${server}`;
            }
            server = new URL(server);
        }
        if (!server.port) {
            server.port = 11443;
        }
        let {pathname} = server;
        if (pathname && pathname.length) {
            if (pathname === '/') {
                pathname = '';
            }
            pathname = pathname.replace(/\//g, '_');
        }
        const hostname = server.host.replace(':', '__');
        return `${account}@${hostname}${pathname}`;
    }
}
