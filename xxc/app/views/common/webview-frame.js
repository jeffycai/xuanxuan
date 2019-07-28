import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import _WebView from './webview';
import Avatar from '../../components/avatar';
import Icon from '../../components/icon';
import {openUrlInBrowser} from '../../core/ui';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * WebView 可替换组件形式
 * @type {Class<WebView>}
 * @private
 */
const WebView = withReplaceView(_WebView);

/**
 * WebviewFrame 组件 ，显示网页视图界面
 * @class WebviewFrame
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import WebviewFrame from './webview-frame';
 * <WebviewFrame />
 */
export default class WebViewFrame extends Component {
    /**
     * WebviewFrame 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof WebviewFrame
     */
    static replaceViewPath = 'common/WebviewFrame';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof WebviewFrame
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        onLoadingChange: PropTypes.func,
        onPageTitleUpdated: PropTypes.func,
        options: PropTypes.object,
        src: PropTypes.string.isRequired,
        displayId: PropTypes.any
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof WebviewFrame
     * @static
     */
    static defaultProps = {
        className: null,
        onLoadingChange: null,
        onPageTitleUpdated: null,
        options: null,
        displayId: null
    };

    /**
     * React 组件构造函数，创建一个 WebviewFrame 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            title: props.src,
            favicon: 'mdi-web',
            loading: false,
            isMaximize: false
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof WebviewFrame
     * @return {void}
     */
    componentDidMount() {
        const webview = this.webview.webview;
        if (webview && webview.addEventListener) {
            webview.addEventListener('page-favicon-updated', this.handleFaviconUpdated);
        }
    }

    /**
     * 重新加载网页
     * @private
     * @memberof WebviewFrame
     * @return {void}
     */
    reloadWebview() {
        if (this.webviewId) {
            const webview = document.getElementById(this.webviewId);
            webview.reload();
        }
    }

    /**
     * 处理网站 Favicon 更新事件
     * @param {Event} e 事件对象
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleFaviconUpdated = e => {
        if (e.favicons && e.favicons.length) {
            this.setState({favicon: e.favicons[0]});
        }
    };

    /**
     * 处理网页标题更新事件
     * @param {string} title 网页标题
     * @param {boolean} explicitSet 是否为以明确设置的网页标题
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handlePageTitleChange = (title, explicitSet) => {
        const {onPageTitleUpdated} = this.props;
        const {title: stateTitle} = this.state;
        if (title !== stateTitle) {
            this.setState({title});
        }
        if (onPageTitleUpdated) {
            onPageTitleUpdated(title, explicitSet);
        }
    };

    /**
     * 处理网也加载状态更新事件
     * @param {boolean} loading 是否正在加载
     * @param {...any} params 其他参数
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleLoadingChange = (loading, ...params) => {
        this.setState({loading});
        const {onLoadingChange} = this.props;
        if (onLoadingChange) {
            onLoadingChange(loading, ...params);
        }
    };

    /**
     * 处理点击重新载入按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleReloadBtnClick = () => {
        this.setState({loading: true}, () => {
            this.webview.reloadWebview();
        });
    };

    /**
     * 处理点击停止加载按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleStopBtnClick = () => {
        if (this.webview && this.webview.webview && this.webview.webview.stop) {
            this.webview.webview.stop();
        }
    };

    /**
     * 处理点击返回按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleGoBackBtnClick = () => {
        if (this.webview && this.webview.webview && this.webview.webview.goBack) {
            this.webview.webview.goBack();
        }
    };

    /**
     * 处理点击前进按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleGoForwardBtnClick = () => {
        if (this.webview && this.webview.webview && this.webview.webview.goForward) {
            this.webview.webview.goForward();
        }
    };

    /**
     * 处理点击在浏览器打开按钮事件
     * @param {Event} event 事件对象
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleOpenBtnClick = () => {
        if (this.webview && this.webview.webview && this.webview.webview.getURL) {
            openUrlInBrowser(this.webview.webview.getURL());
        } else {
            openUrlInBrowser(this.props.src);
        }
    };

    /**
     * 处理点击最大化按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleMaximizeBtnClick = () => {
        const {displayId} = this.props;
        if (displayId) {
            const displayEle = document.getElementById(displayId);
            if (displayEle) {
                displayEle.classList.toggle('fullscreen');
                this.setState({isMaximize: displayEle.classList.contains('fullscreen')});
            }
        }
    };

    /**
     * 处理点击开发者工具按钮事件
     * @memberof WebviewFrame
     * @private
     * @return {void}
     */
    handleDevBtnClick = () => {
        if (this.webview && this.webview.webview) {
            this.webview.webview.openDevTools();
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof WebviewFrame
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            className,
            onLoadingChange,
            onPageTitleUpdated,
            src,
            options,
            displayId,
            ...other
        } = this.props;

        const {isMaximize} = this.state;
        const webview = this.webview && this.webview.webview;
        const showNavButtons = !Config.ui['webview.frame.hiddenNavButtons'];

        return (<div className={classes('webview-frame column', className)} {...other}>
            <div className="heading flex-none shadow-2" style={{zIndex: 1031}}>
                {Avatar.render(this.state.loading ? 'mdi-loading spin muted' : this.state.favicon)}
                <div title={this.state.title} className="title text-ellipsis strong">{this.state.title}</div>
                <nav className="nav" style={{marginRight: 40}}>
                    {DEBUG ? <a onClick={this.handleDevBtnClick}>{Icon.render('auto-fix')}</a> : null}
                    <a onClick={this.handleOpenBtnClick}>{Icon.render('open-in-new')}</a>
                    {showNavButtons && <a className={webview && webview.canGoBack && webview.canGoBack() ? '' : 'disabled'} onClick={this.handleGoBackBtnClick}>{Icon.render('arrow-left')}</a>}
                    {showNavButtons && <a className={webview && webview.canGoForward && webview.canGoForward() ? '' : 'disabled'} onClick={this.handleGoForwardBtnClick}>{Icon.render('arrow-right')}</a>}
                    {this.state.loading ? <a onClick={this.handleStopBtnClick}>{Icon.render('close-circle-outline')}</a> : <a onClick={this.handleReloadBtnClick}>{Icon.render('reload')}</a>}
                    {displayId ? <a onClick={this.handleMaximizeBtnClick}>{Icon.render(isMaximize ? 'window-restore' : 'window-maximize')}</a> : null}
                </nav>
            </div>
            <WebView modalId={displayId} ref={e => {this.webview = e;}} className="flex-auto relative" src={src} {...options} onLoadingChange={this.handleLoadingChange} onPageTitleUpdated={this.handlePageTitleChange} />
        </div>);
    }
}
