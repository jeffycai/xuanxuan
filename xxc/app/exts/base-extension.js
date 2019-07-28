import Path from 'path';
import StringHelper from '../utils/string-helper';
// import ExtensionConfig from './extension-config';
import timeSequence from '../utils/time-sequence';
import {matchScore} from '../utils/search-score';
import PinYin from '../utils/pinyin';
import Store from '../utils/store';

/**
 * 扩展类型表
 * @type {Map<string, string>}
 * @private
 */
export const TYPES = {
    app: 'app',
    theme: 'theme',
    plugin: 'plugin',
};

/**
 * 搜索匹配分值表
 * @type {Object[]}
 * @private
 */
const MATCH_SCORE_MAP = [
    {name: 'name', equal: 100, include: 50},
    {name: 'displayName', equal: 100, include: 50},
    {
        name: 'pinyinNames', equal: 50, include: 25, array: true
    },
    {name: 'description', include: 25},
    {
        name: 'keywords', equal: 50, include: 10, array: true
    },
    {name: 'type', equal: 100, prefix: '#'},
    {name: 'author', equal: 100, prefix: '@'},
    {name: 'publisher', equal: 100, prefix: '@'},
    {name: 'homepage', include: 25},
];

/**
 * 扩展基础类
 *
 * @export
 * @class Extension
 */
export default class Extension {
    /**
     * 扩展类型表
     * @type {Map<string, string>}
     * @static
     * @memberof Extension
     */
    static TYPES = TYPES;

    /**
     * 创建一个扩展基础类实例
     * @param {Object} pkgData 扩展的 package.json 文件数据
     * @param {Object} data 扩展的运行时数据
     * @memberof Extension
     */
    constructor(pkgData, data) {
        this.initPkg(pkgData);

        // /**
        //  * 扩展配置对象
        //  * @type {ExtensionConfig}
        //  * @private
        //  */
        // this._config = new ExtensionConfig(this);

        const localData = this.getConfig('_data') || {} ;
        delete localData.remoteLoaded;
        delete localData.loadRemoteFailed;
        delete localData.serverData;

        /**
         * 扩展运行时数据对象
         * @type {Object}
         * @private
         */
        this._data = Object.assign({}, data, localData);
    }

    /**
     * 从扩展的 package.json 文件数据初始化扩展信息
     * @param {Object} pkgData 扩展的 package.json 文件数据
     * @return {void}
     */
    initPkg(pkgData) {
        const pkg = Object.assign({}, pkgData, pkgData.xext);
        if (pkg.xext) {
            delete pkg.xext;
        }

        this._type = TYPES[pkg.type];
        if (!this._type) {
            this._type = TYPES.plugin;
            this.addError('type', `Unknown extension type (${pkg.type}), set to ‘${this._type}’ temporarily.`);
        }
        this._name = pkg.name;
        if (StringHelper.isEmpty(pkg.name) || !(/[A-Za-z0-9_-]+/.test(pkg.name))) {
            this._safeName = `extension-${timeSequence()}`;
            this.addError('name', `Extension name(${pkg.name}) is not valid, use random name '${this._safeName}'.`);
        }

        if (StringHelper.isEmpty(pkg.version)) {
            this.addError('version', 'Extension version not set.');
        }

        this._pkg = pkg;
    }

    /**
     * 添加一个该扩展的错误信息
     * @param {string} name 错误名称
     * @param {string} error 错误信息
     * @return {void}
     */
    addError(name, error) {
        if (!error) {
            error = name;
            name = '_';
        }

        if (!this._errors) {
            this._errors = [];
        }
        if (DEBUG) {
            console.color(`Extension.${this.name}`, 'greenBg', name, 'greenPale', error, 'red');
        }
        this._errors.push({name, error});
    }

    /**
     * 获取错误信息清单
     * @memberof Extension
     * @type {Object[]}
     */
    get errors() {
        return this._errors;
    }

    /**
     * 获取是否有错误信息
     * @memberof Extension
     * @type {boolean}
     */
    get hasError() {
        return this._errors && this._errors.length;
    }

    /**
     * 获取扩展名称的拼音字符串
     * @memberof Extension
     * @type {string}
     */
    get pinyinNames() {
        if (!this._pinyinName) {
            this._pinyinName = PinYin(this.displayName, 'default', false);
        }
        return this._pinyinName;
    }

    /**
     * 获取扩展配置数据
     * @memberof Extension
     * @type {Object}
     */
    get config() {
        return this._config;
    }

    /**
     * 获取扩展显示名称
     * @memberof Extension
     * @type {string}
     */
    get displayName() {
        return StringHelper.ifEmptyThen(this._pkg.displayName, this._name);
    }

    /**
     * 获取扩展类型
     * @memberof Extension
     * @type {string}
     */
    get type() {
        return this._type;
    }

    /**
     * 获取内部名称
     * @memberof Extension
     * @type {string}
     */
    get name() {
        return this._safeName || this._name;
    }

    /**
     * 获取是否主题类型扩展
     * @memberof Extension
     * @type {boolean}
     */
    get isTheme() {
        return this._type === TYPES.theme;
    }

    /**
     * 获取是否插件类型扩展
     * @memberof Extension
     * @type {boolean}
     */
    get isPlugin() {
        return this._type === TYPES.plugin;
    }

    /**
     * 获取是否是应用类型扩展
     * @memberof Extension
     * @type {boolean}
     */
    get isApp() {
        return this._type === TYPES.app;
    }

    /**
     * 获取是否内置扩展
     * @memberof Extension
     * @type {boolean}
     */
    get buildIn() {
        return this._pkg.buildIn;
    }

    /**
     * 获取扩展内置配置信息
     * @memberof Extension
     * @type {{name: string}[]}
     */
    get configurations() {
        return this._pkg.configurations || [];
    }

    /**
     * 获取扩展的 package.json 文件数据
     * @memberof Extension
     * @type {Object}
     */
    get pkg() {return this._pkg;}

    /**
     * 获取扩展描述信息
     * @memberof Extension
     * @type {string}
     */
    get description() {return this._pkg.description;}

    /**
     * 获取扩展版本信息
     * @memberof Extension
     * @type {string}
     */
    get version() {return this._pkg.version;}

    /**
     * 获取扩展作者信息
     * @memberof Extension
     * @type {{name: string, email: string}}
     */
    get author() {return this._pkg.author;}

    /**
     * 获取发布者信息
     * @memberof Extension
     * @type {{name: string, email: string}}
     */
    get publisher() {return this._pkg.publisher;}

    /**
     * 获取扩展版权信息
     * @memberof Extension
     * @type {string}
     */
    get license() {return this._pkg.license;}

    /**
     * 获取扩展主页链接
     * @memberof Extension
     * @type {string}
     */
    get homepage() {return this._pkg.homepage;}

    /**
     * 获取扩展关键字清单
     * @memberof Extension
     * @type {string[]}
     */
    get keywords() {return this._pkg.keywords;}

    /**
     * 获取扩展扩展要求的运行环境
     * @memberof Extension
     * @type {{xuanxuan: string, platform: string, extensions: string[]}}
     */
    get engines() {return this._pkg.engines;}

    /**
     * 获取版本库信息
     * @memberof Extension
     * @type {{type: string, url: string}}
     */
    get repository() {return this._pkg.repository;}

    /**
     * 获取问题反馈地址
     * @memberof Extension
     * @type {{url: string}}
     */
    get bugs() {return this._pkg.bugs;}

    /**
     * 获取扩展是否支持热加载
     * @memberof Extension
     * @type {boolean}
     */
    get hot() {return !!this._pkg.hot;}

    /**
     * 获取远程免登录入口地址
     * @memberof Extension
     * @type {string}
     */
    get entryUrl() {return this._pkg.entryUrl;}

    /**
     * 获取远程免登录入口 ID
     * @memberof Extension
     * @type {string}
     */
    get entryID() {return this._pkg.entryID;}

    /**
     * 获取远程免登录入口地址
     *
     * @param {string} [referer=''] 要访问的地址
     * @param {string} [entryID=null] 远程免登录入口 ID
     * @returns {Promise} 使用 Promise 异步返回处理结果
     * @memberof Extension
     */
    getEntryUrl(referer = '', entryID = null) {
        if (global.ExtsRuntime) {
            const {getEntryVisitUrl} = global.ExtsRuntime;
            if (getEntryVisitUrl) {
                return getEntryVisitUrl(entryID || this, referer);
            }
        }
        return Promise.resolve(this.entryUrl);
    }

    /**
     * 获取是否支持远程免登录
     * @memberof Extension
     * @type {boolean}
     */
    get hasServerEntry() {
        return this.entryID || this._pkg.entry;
    }

    /**
     * 获取远程额外数据
     * @memberof Extension
     * @type {any}
     */
    get serverData() {
        return this._data.serverData;
    }

    /**
     * 获取远程扩展下载地址
     * @memberof Extension
     * @type {string}
     */
    get download() {return this._pkg.download;}

    /**
     * 获取是否是远程扩展
     * @memberof Extension
     * @type {boolean}
     */
    get isRemote() {return this._data.remote;}

    /**
     * 获取当前扩展是否为内置或远程扩展
     *
     * @readonly
     * @memberof Extension
     * @type {boolean}
     */
    get isBuildInOrRemote() {
        return this.isRemote || this.buildIn;
    }

    /**
     * 获取远程扩展是否加载完毕
     * @memberof Extension
     * @type {boolean}
     */
    get isRemoteLoaded() {return this._data.remoteLoaded;}

    /**
     * 获取远程 MD5 值
     * @memberof Extension
     * @type {string}
     */
    get md5() {return this._pkg.md5;}

    /**
     * 获取扩展所属的用户
     * @memberof Extension
     * @type {string}
     */
    get user() {return this._data.user;}

    /**
     * 获取远程扩展缓存路径
     * @memberof Extension
     * @type {string}
     */
    get remoteCachePath() {return this._data.remoteCachePath;}

    /**
     * 获取远程扩展是否加载失败
     * @memberof Extension
     * @type {boolean}
     */
    get loadRemoteFailed() {return this._data.loadRemoteFailed;}

    /**
     * 获取远程扩展下载进度，百分比，取值范围 0~100
     * @memberof Extension
     * @type {number}
     */
    get downloadProgress() {
        if (this.isRemoteLoaded) {
            return 1;
        }
        if (!this._data.downloadProgress) {
            return 0;
        }
        return this._data.downloadProgress;
    }

    /**
     * 设置远程扩展下载进度，百分比，取值范围 0~100
     * @param {number} progress 远程扩展下载进度
     * @memberof Extension
     */
    set downloadProgress(progress) {
        this._data.downloadProgress = progress;
    }

    /**
     * 设置远程扩展加载结果
     *
     * @param {boolean} result 是否加载失败
     * @param {Error} [error=null] 设置加载失败的错误信息
     * @return {void}
     * @memberof Extension
     */
    setLoadRemoteResult(result, error = null) {
        this._data.loadRemoteFailed = !result;
        this._data.remoteLoaded = !!result;
        if (error) {
            this.addError(error);
        }
    }

    /**
     * 获取扩展配色
     * @memberof Extension
     * @type {string}
     */
    get accentColor() {
        return this._pkg.accentColor || '#f50057';
    }

    /**
     * 获取扩展模块入口文件路径
     * @memberof Extension
     * @type {string}
     */
    get mainFile() {
        if (!this._mainFile) {
            const {buildIn} = this;
            if (buildIn && buildIn.module) {
                this._mainFile = 'BUILD-IN';
            } else if (this.pkg.main) {
                this._mainFile = Path.join(this.localPath, this.pkg.main);
            }
        }
        return this._mainFile;
    }

    /**
     * 获取扩展图标
     * @memberof Extension
     * @type {string}
     */
    get icon() {
        const {icon} = this._pkg;
        if (icon && !this._icon) {
            if (icon.length > 1 && !icon.startsWith('http://') && !icon.startsWith('https://') && !icon.startsWith('mdi-') && !icon.startsWith('icon')) {
                this._icon = `file://${Path.join(this.localPath, icon)}`;
            } else {
                this._icon = icon;
            }
        }
        return this._icon || 'mdi-cube';
    }

    /**
     * 获取通知消息发送者信息配置
     *
     * @readonly
     * @memberof Extension
     * @type {Map<String, Object>}
     */
    get notificationSenders() {
        if (!this._notificationSenders) {
            const extModule = this.module;
            const notificationSenders = (extModule && extModule.commands) || this._pkg.notificationSenders;
            if (notificationSenders) {
                Object.keys(notificationSenders).forEach(senderId => {
                    const sender = notificationSenders[senderId];
                    if (sender.avatar && !sender.avatar.startsWith('http://') && !sender.avatar.startsWith('https://')) {
                        sender.avatar = `file://${Path.join(this.localPath, sender.avatar)}`;
                    }
                });
            }
            this._notificationSenders = notificationSenders;
        }
        return this._notificationSenders;
    }

    /**
     * 获取指定的通知消息发送者信息配置对象
     * @param {Object|string} sender 发送者 ID 或发送者信息对象
     * @return {Object} 发送者信息配置对象
     */
    getNotificationSender(sender) {
        const {notificationSenders} = this;
        if (typeof sender !== 'object') {
            sender = {id: sender};
        }
        return (notificationSenders && notificationSenders[sender.id]) ? Object.assign(sender, notificationSenders[sender.id]) : null;
    }

    /**
     * 获取扩展作者名称
     * @memberof Extension
     * @type {string}
     */
    get authorName() {
        const {author} = this;
        return author && (author.name || author);
    }

    /**
     * 获取扩展存储数据
     * @memberof Extension
     * @type {{data: Object, pkg: Object}}
     */
    get storeData() {
        return {
            data: this._data,
            pkg: this._pkg
        };
    }

    /**
     * 获取扩展运行时数据
     * @memberof Extension
     * @type {Object}
     */
    get data() {
        return this._data;
    }

    /**
     * 获取扩展安装时间（时间戳形式）
     * @memberof Extension
     * @type {number}
     */
    get installTime() {
        return this._data.installTime;
    }

    /**
     * 设置扩展安装时间
     * @param {number} time 扩展安装时间（时间戳形式）
     * @memberof Extension
     */
    set installTime(time) {
        this._data.installTime = time;
        this.updateTime = time;
    }

    /**
     * 获取是否已禁用扩展
     * @memberof Extension
     * @type {boolean}
     */
    get disabled() {
        return this._data.disabled === true;
    }

    /**
     * 设置是否禁用扩展
     * @param {boolean} disabled 禁用扩展
     * @memberof Extension
     */
    set disabled(disabled) {
        if (this._data.disabled !== disabled && !this.hot) {
            this._needRestart = true;
        }
        this._data.disabled = disabled;
    }

    /**
     * 获取扩展是否可用
     * @memberof Extension
     * @type {boolean}
     */
    get avaliable() {
        return !this.disabled && !this.needRestart && (!this.isRemote || this.isRemoteLoaded);
    }

    /**
     * 获取扩展上次更新的时间（时间戳）
     * @memberof Extension
     * @type {number}
     */
    get updateTime() {
        return this._data.updateTime;
    }

    /**
     * 设置扩展上次更新的时间（时间戳）
     * @param {number} time 扩展上次更新的时间（时间戳）
     * @memberof Extension
     */
    set updateTime(time) {
        this._data.updateTime = time;
    }

    /**
     * 获取扩展本地文件路径
     * @memberof Extension
     * @type {string}
     */
    get localPath() {
        return this._data.localPath;
    }

    /**
     * 设置扩展本地文件路径
     * @param {string} localPath 扩展本地文件路径
     * @memberof Extension
     */
    set localPath(localPath) {
        this._data.localPath = localPath;
    }

    /**
     * 获取是否为正在开发中的扩展
     * @memberof Extension
     * @type {boolean}
     */
    get isDev() {
        return this._data.isDev;
    }

    /**
     * 设置是否为正在开发中的扩展
     * @param {boolean} flag 为正在开发中的扩展
     * @memberof Extension
     */
    set isDev(flag) {
        this._data.isDev = flag;
    }

    /**
     * 获取是否有 JS 模块
     * @memberof Extension
     * @type {boolean}
     */
    get hasModule() {
        return this.mainFile;
    }

    /**
     * 获取扩展配置项值
     *
     * @param {?string} key 配置名称
     * @return {any} 扩展配置值
     * @memberof Extension
     */
    getConfig(key) {
        if (!this._config) {
            this._config = Store.get(`EXTENSION::${this.name}::config`, {});
        }
        return key === undefined ? this._config : this._config[key];
    }

    /**
     * 设置扩展配置项
     *
     * @param {string|Object} key 配置名称或者配置对象
     * @param {any} value 配置值，如果 `key` 为 `Object` 则忽略此参数
     * @memberof Extension
     * @return {void}
     */
    setConfig(key, value) {
        const config = this.getConfig();
        if (typeof key === 'object') {
            Object.assign(config, key);
        } else {
            config[key] = value;
        }
        this._config = config;
        Store.set(`EXTENSION::${this.name}::config`, this._config);
    }

    /**
     * 获取扩展用户配置项值
     *
     * @param {string} key 配置名称
     * @param {any} defualtValue 默认值
     * @return {any} 扩展配置值
     * @memberof Extension
     */
    getUserConfig(key, defualtValue) {
        if (Extension.user) {
            return Extension.user.config.getForExtension(this.name, key, defualtValue);
        }
        if (DEBUG) {
            console.warn('Cannot set user config for the exteions, because current user is not logined.', this);
        }
        return defualtValue;
    }

    /**
     * 设置扩展用户配置项
     *
     * @param {string|Object} key 配置名称或者配置对象
     * @param {any} value 配置值，如果 `key` 为 `Object` 则忽略此参数
     * @memberof Extension
     * @return {void}
     */
    setUserConfig(key, value) {
        if (Extension.user) {
            return Extension.user.config.setForExtension(this.name, key, value);
        }
        if (DEBUG) {
            console.warn('Cannot set user config for the exteions, because current user is not logined.', this);
        }
    }

    /**
     * 重新载入扩展模块
     *
     * @return {any} 扩展模块
     * @memberof Extension
     */
    loadModule() {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return null;
        }
        const {mainFile} = this;
        if (mainFile) {
            const start = new Date().getTime();

            if (mainFile === 'BUILD-IN') {
                this._module = this.buildIn.module;
            } else {
                try {
                    this._module = __non_webpack_require__(this.mainFile); // eslint-disable-line
                } catch (err) {
                    if (DEBUG) {
                        console.collapse('Extension Attach', 'greenBg', this.name, 'redPale', 'load module error', 'red');
                        console.error('error', err);
                        console.log('extension', this);
                        console.groupEnd();
                    }
                    this._module = {};
                }
            }

            if (this._module) {
                this.callModuleMethod('onAttach', this);
            }

            this._loadTime = new Date().getTime() - start;
            this._loaded = true;

            if (DEBUG) {
                console.collapse('Extension Attach', 'greenBg', this.name, 'greenPale', `spend time: ${this._loadTime}ms`, 'orange');
                console.trace('extension', this);
                console.log('module', this._module);
                console.groupEnd();
            }
        }
        return this._module;
    }

    /**
     * 获取扩展模块是否已经加载
     * @memberof Extension
     * @type {boolean}
     */
    get isModuleLoaded() {
        return this._loaded;
    }

    /**
     * 获取扩展是否需要重新载入才能启用
     * @memberof Extension
     * @type {boolean}
     */
    get needRestart() {
        return this._needRestart || (!this.disabled && this.hasModule && !this._loaded && !this.hot);
    }

    /**
     * 加载并启用扩展
     *
     * @return {boolean} 如果为 `true` 表示加载成功，否则表示加载失败
     * @memberof Extension
     */
    attach() {
        if (!this.disabled && !this._loaded && this.hasModule) {
            this.loadModule();
            return true;
        }
    }

    /**
     * 热加载并启用扩展
     *
     * @return {boolean} 如果为 `true` 表示加载成功，否则表示加载失败
     * @memberof Extension
     */
    hotAttach() {
        if (this.hot && this.attach()) {
            this.callModuleMethod('onReady', this);
            return true;
        }
        return false;
    }

    /**
     * 停用并卸载扩展
     *
     * @return {void}
     * @memberof Extension
     */
    detach() {
        if (this._module && this._loaded) {
            this.callModuleMethod('onDetach', this);
        }
        const {mainFile} = this;
        // eslint-disable-next-line no-undef
        if (mainFile && mainFile !== 'BUILD-IN' && __non_webpack_require__.cache) {
            delete __non_webpack_require__.cache[mainFile]; // eslint-disable-line
        }
        this._module = null;
        this._loaded = false;
        if (DEBUG) {
            console.collapse('Extension Detach', 'greenBg', this.name, 'greenPale');
            console.trace('extension', this);
            console.groupEnd();
        }
    }

    /**
     * 获取是否拥有 React 视图替换组件
     * @memberof Extension
     * @type {boolean}
     */
    get hasReplaceViews() {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return false;
        }
        const extModule = this.module;
        return extModule && extModule.replaceViews;
    }

    /**
     * 获取 React 视图替换组件清单
     * @memberof Extension
     * @type {Map<string, Class<Component>>}
     */
    get replaceViews() {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return null;
        }
        const extModule = this.module;
        return extModule && extModule.replaceViews;
    }

    /**
     * 获取上次加载此扩展所花费的时间，单位为毫秒
     * @memberof Extension
     * @type {number}
     */
    get loadTime() {
        return this._loadTime;
    }

    /**
     * 获取加载后的扩展模块
     * @memberof Extension
     * @type {any}
     */
    get module() {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return false;
        }
        return this._module || this.loadModule();
    }

    /**
     * 调用扩展模块方法
     *
     * @param {string} methodName 方法名称
     * @param {...any} params 方法参数
     * @return {any} 如果返回所调用的方法返回值
     * @memberof Extension
     */
    callModuleMethod(methodName, ...params) {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return;
        }
        const extModule = this._module;
        if (extModule && extModule[methodName]) {
            try {
                return extModule[methodName].apply(this, params);
            } catch (err) {
                if (DEBUG) {
                    console.collapse('Extension Attach', 'greenBg', this.name, 'redPale', `call module method '${methodName}' error`, 'red');
                    console.log('methodName', methodName);
                    console.log('params', params);
                    console.log('error', err);
                    console.log('extension', this);
                    console.groupEnd();
                }
            }
        }
    }

    /**
     * 获取扩展支持的命令
     * @memberof Extension
     * @type {Map<string, any>}
     */
    get commands() {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return null;
        }
        const extModule = this.module;
        return extModule && extModule.commands;
    }

    /**
     * 获取指定名称的扩展命令
     *
     * @param {string} commandName 命令名称
     * @return {any} 扩展命令
     * @memberof Extension
     */
    getCommand(commandName) {
        const {commands} = this;
        let command = commands && commands[commandName];
        if (command) {
            if (typeof command === 'function') {
                command = {func: command, name: commandName};
            }
        }
        command.name = `extension/${commandName}`;
        return command;
    }

    /**
     * 获取网址解析器
     *
     * @param {string} url 要解析的网址
     * @param {string} [type='inspect'] 解析类型，包括 `'inspect'` 和 `'open'`
     * @return {any} 网址解析器对象
     * @memberof Extension
     */
    getUrlInspector(url, type = 'inspect') {
        if (this.disabled) {
            if (DEBUG) {
                console.warn('The extension has been disbaled.', this);
            }
            return null;
        }
        const extModule = this.module;
        let urlInspectors = extModule && extModule.urlInspectors;
        if (urlInspectors) {
            try {
                const urlObj = new URL(url);
                if (!Array.isArray(urlInspectors)) {
                    urlInspectors = [urlInspectors];
                }
                const urlInspector = urlInspectors.find(x => {
                    if (!x[type]) {
                        return false;
                    }
                    if (typeof x.test === 'function') {
                        return x.test(url, urlObj);
                    }
                    if (Array.isArray(x.test)) {
                        x.test = new Set(x.test);
                    } else if (typeof x.test === 'string') {
                        x.test = new RegExp(x.test, 'i');
                    }
                    if (x.test instanceof Set) {
                        return x.test.has(urlObj.host);
                    }
                    return x.test.test(url);
                });
                if (urlInspector && !urlInspector.provider) {
                    urlInspector.provider = {
                        icon: this.icon,
                        name: this.name,
                        label: this.displayName,
                        url: `!showExtensionDialog/${this.name}`
                    };
                }
                return urlInspector;
            } catch (_) {
                return null;
            }
        }
        return null;
    }


    /**
     * 获取网址打开处理器
     *
     * @param {string} url 要打开的网址
     * @return {any} 网址打开处理器对象
     * @memberof Extension
     */
    getUrlOpener(url) {
        return this.getUrlInspector(url, 'open');
    }

    /**
     * 格式化上下文菜单条目
     *
     * @param {Object} menuItem 要格式化的上下文菜单条目
     * @param {Object} urlFormatObject 网址格式化对象
     * @return {Object} 上下文菜单条目
     * @memberof Extension
     */
    formatContextMenuItem(menuItem, urlFormatObject) {
        urlFormatObject = Object.assign({}, urlFormatObject, {EXTENSION: `extension/${this.name}`});
        menuItem = Object.assign({}, menuItem);
        if (menuItem.url) {
            menuItem.url = StringHelper.format(menuItem.url, urlFormatObject);
        }
        menuItem.label = `${menuItem.label || menuItem.url}`;
        if (menuItem.label[0] === '!') {
            menuItem.label = menuItem.label.substr(1);
        } else {
            menuItem.label = `${this.displayName}: ${menuItem.label}`;
        }
        if (!menuItem.icon) {
            menuItem.icon = this.icon;
        }
        return menuItem;
    }

    /**
     * 获取上下文菜单生成器
     *
     * @return {Object[]} 上下文菜单生成器列表
     * @memberof Extension
     */
    getContextMenuCreators() {
        const creators = this._pkg.contextMenuCreators || [];
        const extModule = this.module;
        if (extModule && extModule.contextMenuCreators) {
            creators.push(...extModule.contextMenuCreators);
        }
        return creators;
    }

    /**
     * 获取扩展与给定的关键字匹配分值
     * @memberof Extension
     * @param {string[]} keys 关键字列表
     * @return {number} 匹配的分值
     */
    getMatchScore(keys) {
        return matchScore(MATCH_SCORE_MAP, this, keys);
    }

    /**
     * 保存扩展自定义数据
     * @return {void}
     */
    saveData() {
        const data = Object.assign({}, this._data);
        delete data.remoteLoaded;
        delete data.loadRemoteFailed;
        delete data.serverData;
        this.setConfig('_data', data);
    }
}
