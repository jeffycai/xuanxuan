import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Lang from '../../core/lang';
import AppAvatar from '../../components/app-avatar';
import SearchControl from '../../components/search-control';
import Button from '../../components/button';
import Exts from '../../exts';
import ROUTES from '../common/routes';
import App from '../../core';

/**
 * AppHome 组件 ，显示应用“主页”界面
 * @class AppHome
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import AppHome from './app-home';
 * <AppHome />
 */
export default class AppHome extends PureComponent {
    /**
     * AppHome 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof AppHome
     */
    static replaceViewPath = 'exts/AppHome';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof AppHome
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof AppHome
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 AppHome 组件实例，会在装配之前被调用。
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
            search: '',
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof AppHome
     * @return {void}
     */
    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange((changedExtensions) => {
            if (changedExtensions.some(x => x.isApp)) {
                this.forceUpdate();
            }
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof AppHome
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
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
     * 处理应用右键菜单事件
     * @param {Event} e 事件对象
     * @memberof AppHome
     * @private
     * @return {void}
     */
    handleAppContextMenu = e => {
        const app = Exts.all.getExt(e.currentTarget.attributes['data-name'].value);
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, Exts.ui.createAppContextMenu(app));
        e.preventDefault();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof AppHome
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
        } = this.props;

        const {search} = this.state;
        const apps = (search ? Exts.all.searchApps(search) : Exts.all.apps).filter(x => (!x.isFixed && !x.hidden && !x.disabled));

        return (<div className={HTML.classes('app-ext-home dock column single', className)}>
            <header className="app-ext-home-header app-ext-common-header has-padding heading divider flex-none">
                <div className="title text-gray small">{Lang.format(search ? 'ext.home.findAppsCount.format' : 'ext.home.appsCount.format', apps.length)}</div>
                <div className="search-box">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <nav className="toolbar">
                    <div className="nav-item hint--bottom-left has-padding-sm" data-hint={Lang.string('ext.home.manageInExtensionsApp')}>
                        <Button type="a" href={`#${ROUTES.exts.app.id('extensions/type=app')}`} className="iconbutton rounded" icon="settings-box text-gray icon-2x" />
                    </div>
                </nav>
            </header>
            <div className="app-exts-apps row has-padding flex-auto scroll-y content-start">
                {
                    apps.map(app => {
                        if (!app.avatarUIConfig) {
                            app.avatarUIConfig = {auto: app.appIcon, skin: app.appAccentColor, className: 'rounded shadow-1'};
                        }
                        return <AppAvatar onContextMenu={this.handleAppContextMenu} data-name={app.name} key={app.name} title={`【${app.displayName}】${app.description || ''}`} href={`#${ROUTES.exts.app.id(app.name)}`} avatar={app.avatarUIConfig} label={app.displayName} />;
                    })
                }
            </div>
        </div>);
    }
}
