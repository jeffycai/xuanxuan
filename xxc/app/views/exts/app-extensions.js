import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Lang from '../../core/lang';
import SearchControl from '../../components/search-control';
import Icon from '../../components/icon';
import Button from '../../components/button';
import Exts from '../../exts';
import OpenedApp from '../../exts/opened-app';
import App from '../../core';
import _ExtensionListItem from './extension-list-item';
import withReplaceView from '../with-replace-view';

/**
 * ExtensionListItem 可替换组件形式
 * @type {Class<ExtensionListItem>}
 * @private
 */
const ExtensionListItem = withReplaceView(_ExtensionListItem);

/**
 * AppExtensions 组件 ，显示“应用”扩展界面
 * @class AppExtensions
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import AppExtensions from './app-extensions';
 * <AppExtensions />
 */
export default class AppExtensions extends Component {
    /**
     * AppExtensions 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof AppExtensions
     */
    static replaceViewPath = 'exts/AppExtensions';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof AppExtensions
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        app: PropTypes.instanceOf(OpenedApp).isRequired,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof AppExtensions
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 AppExtensions 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {app} = props;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            search: '',
            showInstalled: true,
            type: (app.params && app.params.type) ? app.params.type : ''
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof AppExtensions
     * @return {void}
     */
    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange(() => {
            this.forceUpdate();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof AppExtensions
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
    }

    /**
     * 处理点击导航项目事件
     * @param {string} extType 导航类型名称
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleNavItemClick(extType) {
        this.props.app.params = {type: extType.type};
        this.setState({type: extType.type});
    }

    /**
     * 处理搜索文本变更事件
     * @param {string} search 搜索文本
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleSearchChange = search => {
        this.setState({search});
    };

    /**
     * 处理点击设置按钮事件
     * @param {Extension} ext 点击的扩展对象
     * @param {Event} e 事件对象
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleSettingBtnClick(ext, e) {
        const menuItems = Exts.ui.createSettingContextMenu(ext);
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, menuItems);
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * 处理点击扩展项条目事件
     * @param {Extension} ext 点击的扩展对象
     * @param {Event} e 事件对象
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleExtensionItemClick(ext, e) {
        Exts.ui.showExtensionDetailDialog(ext);
        if (DEBUG) {
            console.collapse('Extension View', 'greenBg', ext.displayName, 'greenPale');
            console.log('extension', ext);
            console.groupEnd();
        }
    }

    /**
     * 处理点击安装按钮事件
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleInstallBtnClick = () => {
        Exts.ui.installExtension();
    };

    /**
     * 处理点击菜单按钮事件
     * @param {Event} e 事件对象
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleMenuBtnClick = e => {
        const menu = [{
            label: Lang.string('ext.extensions.installDevExtension'),
            click: () => {
                Exts.ui.installExtension(true);
            }
        }];
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, menu);
    };

    /**
     * 处理点击重新载入按钮事件
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleRestartBtnClick = () => {
        App.ui.reloadWindow();
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof AppExtensions
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
        } = this.props;

        const {search, type} = this.state;
        const extensions = search ? Exts.all.search(search, type) : Exts.all.getTypeList(type);
        const needRestartExts = extensions && extensions.filter(x => x.needRestart);

        /**
         * 扩展类型表
         * @type {{type: string, label:string}[]}
         * @private
         */
        const extensionTypes = [
            {type: '', label: Lang.string('ext.extensions.all')},
            {type: 'app', label: Lang.string('ext.extensions.apps')},
            {type: 'plugin', label: Lang.string('ext.extensions.plugins')},
            {type: 'theme', label: Lang.string('ext.extensions.themes')},
        ];

        return (<div className={HTML.classes('app-ext-extensions dock column single', className)}>
            <header className="app-ext-extensions-header app-ext-common-header has-padding heading divider flex-none">
                <nav className="nav">
                    {
                        extensionTypes.map(extType => {
                            return <a key={extType.type} onClick={this.handleNavItemClick.bind(this, extType)} className={extType.type === type ? 'active' : ''}>{extType.label}</a>;
                        })
                    }
                </nav>
                <div className="search-box">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <nav className="toolbar">
                    <div className="nav-item has-padding-sm hint--left" data-hint={Lang.string('ext.extensions.installLocalExtTip')}>
                        <Button onClick={this.handleInstallBtnClick} className="rounded outline green hover-solid" icon="package-variant" label={Lang.string('ext.extensions.installLocalExtension')} />
                    </div>
                    <div className="nav-item has-padding-sm hint--left" data-hint={Lang.string('ext.extensions.moreActions')}>
                        <Button onClick={this.handleMenuBtnClick} className="rounded outline primary hover-solid" icon="menu" />
                    </div>
                </nav>
            </header>
            {
                needRestartExts && needRestartExts.length ? <div className="warning-pale text-warning flex-none center-content"><div className="heading">
                    <Icon name="information" />
                    <div className="title">{Lang.format('ext.extensions.needRestartTip.format', needRestartExts.length)}</div>
                    <Button onClick={this.handleRestartBtnClick} className="outline warning hover-solid rounded" label={Lang.string('ext.extensions.restart')} icon="restart" />
                </div></div> : null
            }
            <div className="app-exts-list list has-padding multi-lines with-avatar flex-auto scroll-y content-start">
                <div className="heading">
                    <div className="title">{Lang.string(search ? 'ext.extensions.searchResult' : 'ext.extensions.installed')}{type ? ` - ${Lang.string('ext.type.' + type)}` : ''} ({extensions.length})</div>
                </div>
                {
                    extensions.map(ext => {
                        const onContextMenu = this.handleSettingBtnClick.bind(this, ext);
                        return (<ExtensionListItem
                            showType={!type}
                            key={ext.name}
                            onContextMenu={onContextMenu}
                            onSettingBtnClick={onContextMenu}
                            onClick={this.handleExtensionItemClick.bind(this, ext)}
                            className="item flex-middle"
                            extension={ext}
                        />);
                    })
                }
            </div>
        </div>);
    }
}
