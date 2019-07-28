import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {NavLink, Redirect} from 'react-router-dom';
import {classes} from '../../utils/html-helper';
import Lang from '../../core/lang';
import ROUTES from '../common/routes';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Messager from '../../components/messager';
import Exts from '../../exts';
import _WebApp from './web-app';
import _AppHome from './app-home';
import _AppExtensions from './app-extensions';
import _AppFiles from './app-files';
import _AppThemes from './app-themes';
import App from '../../core';
import {ifEmptyStringThen} from '../../utils/string-helper';
import withReplaceView from '../with-replace-view';

/**
 * WebApp 可替换组件形式
 * @type {Class<WebApp>}
 * @private
 */
const WebApp = withReplaceView(_WebApp);

/**
 * AppThemes 可替换组件形式
 * @type {Class<AppThemes>}
 * @private
 */
const AppThemes = withReplaceView(_AppThemes);

/**
 * AppHome 可替换组件形式
 * @type {Class<AppHome>}
 * @private
 */
const AppHome = withReplaceView(_AppHome);

/**
 * AppFiles 可替换组件形式
 * @type {Class<AppFiles>}
 * @private
 */
const AppFiles = withReplaceView(_AppFiles);

/**
 * AppExtensions 可替换组件形式
 * @type {Class<AppExtensions>}
 * @private
 */
const AppExtensions = withReplaceView(_AppExtensions);

/**
 * 内置应用视图
 * @type {Map<string, Class<Component>>}
 * @private
 */
const buildInView = {
    home: AppHome,
    extensions: AppExtensions,
    files: AppFiles,
    themes: AppThemes
};

/**
 * ExtsIndex 组件 ，显示扩展主界面
 * @class ExtsIndex
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ExtsIndex from './index';
 * <ExtsIndex />
 */
export default class ExtsIndex extends Component {

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ExtsIndex
     * @type {Object}
     */
    static propTypes = {
        match: PropTypes.object.isRequired,
        hidden: PropTypes.bool,
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ExtsIndex
     * @static
     */
    static defaultProps = {
        hidden: false,
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 ExtsIndex 组件实例，会在装配之前被调用。
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
            navScrolled: false,
            loading: {},
            pageTitles: {}
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ExtsIndex
     * @return {void}
     */
    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange(() => {
            this.forceUpdate();
        });
        this.checkAppNotFoundMessage();
        this.checkScrollToCurrentApp();
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof ExtsIndex
     * @return {void}
     */
    componentDidUpdate() {
        this.checkAppNotFoundMessage();
        this.checkScrollToCurrentApp();
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof Index
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
    }

    /**
     * 如果要打开的应用没有找到显示提示消息
     *
     * @memberof ExtsIndex
     * @return {void}
     * @private
     */
    checkAppNotFoundMessage() {
        if (this.appNotFound) {
            Messager.show(Lang.format('exts.appNotFound.format', this.appNotFound), {type: 'warning', position: 'center'});
            this.appNotFound = null;
        }
    }

    /**
     * 处理鼠标滚轮滚动事件
     * @param {Event} e 事件对象
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleWheelEvent = e => {
        e.currentTarget.scrollLeft += e.deltaY;
    }

    /**
     * 滚动导航到当前显示的应用条目上
     *
     * @return {void}
     * @memberof ExtsIndex
     */
    checkScrollToCurrentApp() {
        if (!this.appsNav) {
            return;
        }
        const hasScrollbar = this.appsNav.scrollWidth > this.appsNav.clientWidth;
        if (this.state.navScrolled !== hasScrollbar) {
            this.setState({navScrolled: hasScrollbar});
        } else {
            const currentOpenedApp = Exts.ui.currentOpenedApp;
            if (currentOpenedApp) {
                const navEle = document.getElementById(`ext-nav-item-${currentOpenedApp.name}`);
                if (navEle) {
                    navEle.scrollIntoViewIfNeeded();
                }
            }
        }
    }

    /**
     * 处理点击应用关闭按钮事件
     * @param {Event} e 事件对象
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleAppCloseBtnClick = e => {
        const result = Exts.ui.closeApp(e.currentTarget.attributes['data-id'].value);
        if (result === 'refresh') {
            this.forceUpdate();
        }
        e.stopPropagation();
        e.preventDefault();
    }

    /**
     * 处理点击应用导航左右滚动按钮事件
     * @param {string} direction 滚动方向，包括 `'left'`，`'right'`
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleNavArrowClick(direction) {
        this.appsNav.scrollLeft += (direction === 'left' ? -1 : 1) * Math.min(150, Math.floor(this.appsNav.clientWidth / 2));
    }

    /**
     * 处理应用加载状态更新事件
     * @param {OpenedApp} openApp 打开的应用实例
     * @param {boolean} isLoading 是否正在加载
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleAppLoadingChange(openApp, isLoading) {
        const {loading} = this.state;
        loading[openApp.id] = isLoading;
        this.setState({loading});
    }

    /**
     * 处理应用标题更新事件
     * @param {OpenedApp} openApp 打开的应用实例
     * @param {string} pageTitle 页面标题
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleAppPageTitleUpadted(openApp, pageTitle) {
        const {pageTitles} = this.state;
        pageTitles[openApp.id] = pageTitle;
        this.setState({pageTitles});
    }

    /**
     * 处理应用右键菜单事件
     * @param {OpenedApp} openedApp 打开的应用实例
     * @param {Event} e 事件对象
     * @memberof ExtsIndex
     * @private
     * @return {void}
     */
    handleOpenedAppContextMenu(openedApp, e) {
        const menuItems = Exts.ui.createOpenedAppContextMenu(openedApp, () => {
            this.forceUpdate();
        });
        if (menuItems && menuItems.length) {
            App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, menuItems);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ExtsIndex
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            hidden,
            className,
            match
        } = this.props;

        if (!App.profile.isUserVertified) {
            return null;
        }

        const openedApps = Exts.ui.openedApps;

        let redirectView = null;
        if (match.url.startsWith(ROUTES.exts._)) {
            const openedAppName = match.params.id;
            if (openedAppName) {
                if (!Exts.ui.openAppById(match.params.id, match.params.params)) {
                    this.appNotFound = match.params.id;
                    const defaultAppName = Exts.ui && Exts.ui.defaultApp ? Exts.ui.defaultApp.name : 'home';
                    redirectView = <Redirect to={ROUTES.exts.app.id(defaultAppName)} />;
                }
            } else if (!match.params.filterType) {
                redirectView = <Redirect to={ROUTES.exts.app.id(Exts.ui.currentOpenedApp.name)} />;
            }
        }

        return (<div className={classes('app-exts dock column single', /* 'app-exts-dark', */ `app-exts-current-${Exts.ui.currentOpenedApp.name}`, className, {hidden})}>
            <nav
                className={classes('app-exts-nav nav flex-none', {'app-exts-nav-compact': openedApps.length > 7, 'app-exts-nav-scrolled': this.state.navScrolled})}
                onWheel={this.handleWheelEvent}
                ref={e => {this.appsNav = e;}}
            >
                {
                    openedApps.map(openedApp => {
                        if (openedApp.app.pinnedOnMenu) {
                            return null;
                        }
                        const isCurrentApp = Exts.ui.isCurrentOpenedApp(openedApp.id);
                        const displayName = ifEmptyStringThen(this.state.pageTitles[openedApp.id], openedApp.app.displayName);
                        return (<NavLink
                            onContextMenu={this.handleOpenedAppContextMenu.bind(this, openedApp)}
                            key={openedApp.id}
                            to={openedApp.routePath}
                            className={`ext-nav-item-${openedApp.appName}`}
                            id={`ext-nav-item-${openedApp.name}`}
                            title={openedApp.app.description ? `【${displayName}】 - ${openedApp.app.description}` : displayName}
                        >
                            <Avatar foreColor={isCurrentApp ? openedApp.app.appAccentColor : null} auto={openedApp.app.appIcon} className="rounded flex-none" />
                            {this.state.loading[openedApp.id] && <Avatar icon="loading spin" className="circle loading-icon" />}
                            <span className="text">{displayName}</span>
                            {!openedApp.isFixed && <div title={Lang.string('common.close')} className="close rounded"><Icon data-id={openedApp.id} name="close" onClick={this.handleAppCloseBtnClick} /></div>}
                        </NavLink>);
                    })
                }
                <div className="app-exts-nav-arrows nav">
                    <a className="app-exts-nav-arrow-left" onClick={this.handleNavArrowClick.bind(this, 'left')}><Icon name="menu-left icon-2x" /></a>
                    <a className="app-exts-nav-arrow-right" onClick={this.handleNavArrowClick.bind(this, 'right')}><Icon name="menu-right icon-2x" /></a>
                </div>
            </nav>
            <div className="app-exts-apps flex-auto">
                {
                    openedApps.map(openedApp => {
                        let appView = null;
                        if (openedApp.app.MainView) {
                            appView = <openedApp.app.MainView app={openedApp} onLoadingChange={this.handleAppLoadingChange.bind(this, openedApp)} onPageTitleUpdated={this.handleAppPageTitleUpadted.bind(this, openedApp)} />;
                        } else if (openedApp.app.buildIn && buildInView[openedApp.id]) {
                            const TheAppView = buildInView[openedApp.id];
                            appView = TheAppView && <TheAppView app={openedApp} onLoadingChange={this.handleAppLoadingChange.bind(this, openedApp)} onPageTitleUpdated={this.handleAppPageTitleUpadted.bind(this, openedApp)} />;
                        } else {
                            const directUrl = openedApp.directUrl;
                            if (directUrl) {
                                appView = <WebApp onLoadingChange={this.handleAppLoadingChange.bind(this, openedApp)} onPageTitleUpdated={this.handleAppPageTitleUpadted.bind(this, openedApp)} app={openedApp} />;
                            }
                        }
                        if (!appView) {
                            appView = <div className="box">{Lang.string('exts.appNoView')}({openedApp.id})</div>;
                        }
                        return (<div
                            key={openedApp.id}
                            className={classes(`app-exts-app app-exts-app-${openedApp.id} dock scroll-y`, {'app-exts-app-pinned': openedApp.app.pinnedOnMenu, hidden: !Exts.ui.isCurrentOpenedApp(openedApp.id)})}
                            style={{backgroundColor: openedApp.app.appBackColor}}
                        >{appView}</div>);
                    })
                }
            </div>
            {redirectView}
        </div>);
    }
}
