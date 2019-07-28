import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import OpenedApp from '../../exts/opened-app';
import _WebView from '../common/webview';
import withReplaceView from '../with-replace-view';

/**
 * WebView 可替换组件形式
 * @type {Class<WebView>}
 * @private
 */
const WebView = withReplaceView(_WebView);

/**
 * WebApp 组件 ，显示内嵌 Web 页面应用界面
 * @class WebApp
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import WebApp from './web-app';
 * <WebApp />
 */
export default class WebApp extends Component {
    /**
     * WebApp 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof WebApp
     */
    static replaceViewPath = 'exts/WebApp';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof WebApp
     * @type {Object}
     */
    static propTypes = {
        app: PropTypes.instanceOf(OpenedApp).isRequired,
        className: PropTypes.string,
        onLoadingChange: PropTypes.func,
        onPageTitleUpdated: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof WebApp
     * @static
     */
    static defaultProps = {
        className: null,
        onLoadingChange: null,
        onPageTitleUpdated: null,
    };

    /**
     * React 组件构造函数，创建一个 WebApp 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {app} = this.props;
        const {hasServerEntry} = app.app;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            url: hasServerEntry ? null : (app.directUrl || app.app.webViewUrl),
            loading: hasServerEntry
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof WebApp
     * @return {void}
     */
    componentDidMount() {
        const {app} = this.props;
        if (this.webview) {
            app.webview = this.webview.webview;
        }
        const {loading} = this.state;
        if (loading) {
            app.app.getEntryUrl().then(url => {
                this.setState({url, loading: false});
            }).catch(_ => {
                this.setState({loading: false});
            });
        }
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof WebApp
     * @return {void}
     */
    componentDidUpdate() {
        if (this.webview) {
            this.props.app.webview = this.webview.webview;
        }
    }

    /**
     * 处理网页标题更新事件
     * @param {string} title 网页标题
     * @param {boolean} explicitSet 是否为以明确设置的网页标题
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleOnPageTitleUpdated = (title, explicitSet) => {
        const {onPageTitleUpdated, app} = this.props;
        if (onPageTitleUpdated) {
            onPageTitleUpdated(explicitSet ? `${app.app.displayName} (${title})` : '');
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof WebApp
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            app,
            onLoadingChange,
        } = this.props;

        const {url, loading} = this.state;
        let webView = null;
        if (url) {
            const nodeintegration = app.app.isLocalWebView;
            const preload = app.app.webViewPreloadScript;
            const {injectScript, injectCSS} = app.app;
            webView = <WebView ref={e => {this.webview = e;}} className="dock scroll-none" src={url} onLoadingChange={onLoadingChange} onPageTitleUpdated={this.handleOnPageTitleUpdated} nodeintegration={nodeintegration} preload={preload} insertCss={injectCSS} executeJavaScript={injectScript} />;
        }

        return (
            <div className={classes('app-web-app load-indicator', className, {loading})}>
                {webView}
            </div>
        );
    }
}
