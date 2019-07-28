import Path from 'path';
import Extension from './base-extension';
import {isWebUrl} from '../utils/html-helper';

/**
 * 应用扩展类型
 * @type {Map<string, string>}
 * @private
 */
export const APP_TYPES = {
    insideView: 'insideView',
    webView: 'webView'
};

/**
 * 应用扩展类
 *
 * @export
 * @class AppExtension
 * @extends {Extension}
 */
export default class AppExtension extends Extension {
    /**
     * 创建一个应用扩展类实例
     * @param {Object} pkg 扩展的 package.json 文件数据
     * @param {Object} data 扩展的运行时数据
     * @memberof AppExtension
     */
    constructor(pkg, data) {
        super(pkg, data);

        if (!this.isApp) {
            throw new Error(`Cannot create a app extension from the type '${this.type}'.`);
        }

        /**
         * 应用类型缓存变量
         * @type {string}
         * @private
         */
        this._appType = APP_TYPES[pkg.appType];

        if (!this._appType) {
            this._appType = pkg.webViewUrl ? APP_TYPES.webView : APP_TYPES.insideView;
            this.addError('appType', `AppType (${pkg.appType}) must be one of '${Object.keys(APP_TYPES).join(',')}', set to ‘${this._appType}’ temporarily.`);
        }

        if (this._appType === APP_TYPES.webView && !pkg.webViewUrl) {
            this.addError('webViewUrl', 'The webViewUrl attribute must be set when appType is \'webView\'.');
        }
    }

    /**
     * 获取应用类型是否是内嵌网页应用
     * @memberof AppExtension
     * @type {boolean}
     */
    get isWebview() {
        return this._appType === APP_TYPES.webView;
    }

    /**
     * 获取应用类型
     * @memberof AppExtension
     * @type {string}
     */
    get appType() {
        return this._appType;
    }

    /**
     * 获取内嵌网页应用地址
     * @memberof AppExtension
     * @type {string}
     */
    get webViewUrl() {
        if (this._appType !== APP_TYPES.webView) {
            return null;
        }
        if (this.auth) {
            return this.auth;
        }
        const {webViewUrl} = this._pkg;
        if (webViewUrl && !this._webViewUrl) {
            if (!isWebUrl(webViewUrl)) {
                this._isLocalWebView = true;
                this._webViewUrl = `file://${Path.join(this.localPath, webViewUrl)}`;
            } else {
                this._isLocalWebView = false;
                this._webViewUrl = webViewUrl;
            }
        }
        return this._webViewUrl;
    }

    /**
     * 获取应用的免登录地址
     * @param {string} referer 要访问的地址，如果留空使用应用主页地址
     * @param {string} entryID 入口 ID，如果留空使用应用的 ID
     * @returns {Promise} 使用 Promise 异步返回处理结果
     */
    getEntryUrl(referer = null, entryID = null) {
        if (this.hasServerEntry) {
            return super.getEntryUrl(referer, entryID);
        }
        return Promise.resolve(this.webViewUrl);
    }

    /**
     * 获取内嵌网页预加载脚本
     * @memberof AppExtension
     * @type {string}
     */
    get webViewPreloadScript() {
        if (this._appType !== APP_TYPES.webView) {
            return null;
        }
        const {webViewPreloadScript} = this._pkg;
        if (webViewPreloadScript && !this._webViewPreloadScript) {
            /**
             * 内嵌网页预加载脚本缓存变量
             * @type {string}
             * @private
             */
            this._webViewPreloadScript = `file://${Path.join(this.localPath, webViewPreloadScript)}`;
        }
        return this._webViewPreloadScript;
    }

    /**
     * 获取内嵌网页注入 CSS
     * @memberof AppExtension
     * @type {string}
     */
    get injectCSS() {
        return this._pkg.injectCSS;
    }

    /**
     * 获取内嵌网页注入脚本
     * @memberof AppExtension
     * @type {string}
     */
    get injectScript() {
        return this._pkg.injectScript;
    }

    /**
     * 获取是否是本地内嵌网页
     * @memberof AppExtension
     * @type {boolean}
     */
    get isLocalWebView() {
        // 调用 webViewUrl 属性，确保 _isLocalWebView 变量被赋值
        const webViewUrl = this.webViewUrl; // eslint-disable-line
        return this._isLocalWebView;
    }

    /**
     * 获取应用配色
     * @memberof AppExtension
     * @type {string}
     */
    get appAccentColor() {return this._pkg.appAccentColor || this._pkg.accentColor;}

    /**
     * 获取应用背景色
     * @memberof AppExtension
     * @type {string}
     */
    get appBackColor() {return this._pkg.appBackColor;}

    /**
     * 获取应用图标
     * @memberof AppExtension
     * @type {string}
     */
    get appIcon() {
        const {appIcon} = this._pkg;
        if (appIcon && !this._appIcon) {
            if (appIcon.length > 1 && !appIcon.startsWith('http://') && !appIcon.startsWith('https://') && !appIcon.startsWith('mdi-') && !appIcon.startsWith('icon')) {
                this._appIcon = `file://${Path.join(this.localPath, appIcon)}`;
            } else {
                this._appIcon = appIcon;
            }
        }
        return this._appIcon || super.icon;
    }

    /**
     * 获取应用在菜单上显示的图标
     * @memberof AppExtension
     * @type {string}
     */
    get menuIcon() {
        const {menuIcon} = this._pkg;
        if (menuIcon && !this._menuIcon) {
            if (menuIcon.length > 1 && !menuIcon.startsWith('http://') && !menuIcon.startsWith('https://') && !menuIcon.startsWith('mdi-') && !menuIcon.startsWith('icon')) {
                this._menuIcon = `file://${Path.join(this.localPath, menuIcon)}`;
            } else {
                this._menuIcon = menuIcon;
            }
        }
        return this._menuIcon || this.appIcon;
    }

    /**
     * 获取扩展图标
     * @memberof AppExtension
     * @type {string}
     */
    get icon() {return this._pkg.icon ? super.icon : this.appIcon;}

    /**
     * 获取扩展配色
     * @memberof AppExtension
     * @type {string}
     */
    get accentColor() {return this._pkg.accentColor || this._pkg.appAccentColor;}

    /**
     * 获取应用内部视图入口组件
     * @memberof AppExtension
     * @type {Class<Component>}
     */
    get MainView() {
        const theModule = this.module;
        return theModule && theModule.MainView;
    }

    /**
     * 获取是否为内置应用
     * @memberof AppExtension
     * @type {boolean}
     */
    get buildIn() {
        return this._pkg.buildIn;
    }

    /**
     * 获取是否是默认应用
     * @memberof AppExtension
     * @type {boolean}
     */
    get isDefault() {
        const {buildIn} = this;
        return buildIn && buildIn.asDefault;
    }

    /**
     * 获取是否是固定显示的应用
     * @memberof AppExtension
     * @type {boolean}
     */
    get isFixed() {
        const {buildIn} = this;
        return buildIn && (buildIn.asDefault || buildIn.fixed);
    }

    /**
     * 获取是否允许用户将应用图标固定在窗口菜单上
     * @memberof AppExtension
     * @type {boolean}
     */
    get canPinnedOnMenu() {
        const {pinnedOnMenu} = this._pkg;
        if (pinnedOnMenu === 'fixed' && this.isBuildInOrRemote) {
            return false;
        }
        return !this.isFixed && pinnedOnMenu !== false;
    }

    /**
     * 获取应用图标在导航上显示的顺序
     *
     * @readonly
     * @memberof AppExtension
     * @type {number}
     */
    get pinnedOnMenuOrder() {
        let {pinnedOnMenuOrder} = this._pkg;
        if (pinnedOnMenuOrder === undefined || pinnedOnMenuOrder === null) {
            pinnedOnMenuOrder = this._data.pinnedOnMenuOrder;
        }
        return pinnedOnMenuOrder;
    }

    /**
     * 设置应用图标在导航上显示的顺序
     * @param {number} order 应用图标在导航上显示的顺序
     * @memberof AppExtension
     */
    set pinnedOnMenuOrder(order) {
        this._data.pinnedOnMenuOrder = order;
    }

    /**
     * 获取应用图标是否能够固定在窗口菜单上
     * @memberof AppExtension
     * @type {boolean}
     */
    get pinnedOnMenu() {
        const {pinnedOnMenu} = this._pkg;
        const userPinnedOnMenu = this._data.pinnedOnMenu;
        return (pinnedOnMenu === 'fixed' && this.isBuildInOrRemote) || (pinnedOnMenu !== false && userPinnedOnMenu) || ((pinnedOnMenu === true || pinnedOnMenu === 'fixed') && userPinnedOnMenu !== false);
    }

    /**
     * 设置应用图标是否能够固定在窗口菜单上
     * @param {boolean} flag 是否能够固定在窗口菜单上
     * @memberof AppExtension
     */
    set pinnedOnMenu(flag) {
        const {pinnedOnMenu} = this._pkg;
        if (pinnedOnMenu !== false) {
            this._data.pinnedOnMenu = flag;
        }
    }
}
