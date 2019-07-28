// eslint-disable-next-line import/no-unresolved
import {ifEmptyStringThen} from '../utils/string-helper';
import {getSearchParam} from '../utils/html-helper';
import platform from '../platform';

/**
 * 用户打开的扩展应用类
 *
 * @export
 * @class OpenedApp
 */
export default class OpenedApp {
    /**
     * 创建用户打开的应用 ID
     *
     * @static
     * @memberof OpenedApp
     * @param {string} name 应用名称
     * @param {string} pageName 子界面页面名称
     * @return {string} 用户打开的应用 ID
     */
    static createId = (name, pageName) => (pageName ? `${name}@${pageName}` : name);

    /**
     * 创建一个打开的应用实例
     *
     * @param {AppExtension} app 要打开的应用实例
     * @param {?string} [pageName=null] 子界面名称
     * @param {?(Object|string)} [params=null] 界面访问参数
     */
    constructor(app, pageName = null, params = null) {
        this._app = app;
        this._pageName = pageName;
        this.params = params;

        const now = new Date().getTime();
        this._createTime = now;
        this._openTime = now;
    }

    /**
     * 获取打开的应用 ID
     * @memberof OpenedApp
     * @type {string}
     */
    get id() {
        if (!this._id) {
            this._id = this._pageName ? `${this._app.name}@${this._pageName}` : this._app.name;
        }
        return this._id;
    }

    /**
     * 获取子界面名称
     * @memberof OpenedApp
     * @type {string}
     */
    get pageName() {
        return this._pageName;
    }

    /**
     * 获取标识名称
     * @deprecated 使用 `id` 属性代替
     * @memberof OpenedApp
     * @type {string}
     */
    get name() {
        return this.id;
    }

    /**
     * 获取应用对象
     * @memberof OpenedApp
     * @type {AppExtension}
     */
    get app() {
        return this._app;
    }

    /**
     * 获取应用名
     * @memberof OpenedApp
     * @type {string}
     */
    get appName() {
        return this._app.name;
    }

    /**
     * 获取在界面上显示的名称
     * @memberof OpenedApp
     * @type {string}
     */
    get displayName() {
        return ifEmptyStringThen(this._displayName, this._app.displayName);
    }

    /**
     * 设置显示的名称
     * @memberof OpenedApp
     * @param {string} displayName 示的名称
     */
    set displayName(displayName) {
        this._displayName = displayName;
    }

    /**
     * 获取上次打开的时间戳
     * @memberof OpenedApp
     * @type {number}
     */
    get openTime() {
        return this._openTime;
    }

    /**
     * 获取第一次打开的时间戳
     * @memberof OpenedApp
     * @type {number}
     */
    get createTime() {
        return this._createTime;
    }

    /**
     * 获取是否是固定的应用（无法被关闭）
     * @memberof OpenedApp
     * @type {boolean}
     */
    get isFixed() {
        return this._app.isFixed;
    }

    /**
     * 获取是否默认打开的应用
     * @memberof OpenedApp
     * @type {boolean}
     */
    get isDefault() {
        return this._app.isDefault;
    }

    /**
     * 获取界面访问参数
     * @memberof OpenedApp
     * @type {Object}
     */
    get params() {
        return this._params;
    }

    /**
     * 设置应用访问的参数
     * @memberof OpenedApp
     * @param {Object|string} params 访问的参数对象或者 `key=val1&key=val2` 格式的参数字符串
     */
    set params(params) {
        if (typeof params === 'string') {
            params = getSearchParam(null, params);
        }
        this._params = params;
    }

    /**
     * 获取 Hash 格式的路由地址
     * @memberof OpenedApp
     * @type {string}
     */
    get hashRoute() {
        return `#${this.routePath}`;
    }

    /**
     * 获取路由地址
     * @memberof OpenedApp
     * @type {string}
     */
    get routePath() {
        let route = `/exts/app/${this.id}`;
        if (this.params) {
            const params = Object.keys(this.params).map(x => `${x}=${encodeURIComponent(this.params[x])}`).join('&');
            route += `/${params}`;
        }
        return route;
    }

    /**
     * 获取直接访问地址
     * @memberof OpenedApp
     * @type {string}
     */
    get directUrl() {
        const direct = this.params && this.params.DIRECT;
        return direct || this.app.webViewUrl;
    }

    /**
     * 更新最后打开的时间
     *
     * @param {number} time 最后打开的时间戳
     * @memberof OpenedApp
     * @return {void}
     */
    updateOpenTime(time) {
        this._openTime = time || new Date().getTime();
    }

    /**
     * 获取应用对应的 Webview 对象
     * @memberof OpenedApp
     * @type {Electron.Webview}
     */
    get webview() {
        return this._webview;
    }

    /**
     * 设置应用对应的 Webview 对象
     * @memberof OpenedApp
     * @param {Electron.Webview} webview Webview 对象
     */
    set webview(webview) {
        if (!this._webview) {
            platform.call('webview.initWebview', webview);
        }
        this._webview = webview;
    }
}
