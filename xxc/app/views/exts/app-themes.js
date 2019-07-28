import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Lang from '../../core/lang';
import SearchControl from '../../components/search-control';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import OpenedApp from '../../exts/opened-app';
import Exts from '../../exts';
import App from '../../core';
import Skin from '../../utils/skin';

/**
 * AppThemes 组件 ，显示应用“主题”界面
 * @class AppThemes
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import AppThemes from './app-themes';
 * <AppThemes />
 */
export default class AppThemes extends PureComponent {
    /**
     * AppThemes 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof AppThemes
     */
    static replaceViewPath = 'exts/AppThemes';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof AppThemes
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
     * @memberof AppThemes
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 AppThemes 组件实例，会在装配之前被调用。
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
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof AppThemes
     * @return {void}
     */
    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange((changedExtensions) => {
            if (changedExtensions.some(x => x.isTheme)) {
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
     * @memberof AppThemes
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
     * 处理点击主题事件
     * @param {ThemeExtension} theme 主题
     * @memberof AppThemes
     * @private
     * @return {void}
     */
    handleThemeClick = theme => {
        const error = Exts.themes.setCurrentTheme(theme);
        if (error) {
            App.ui.showMessger(Lang.error(error), {type: 'danger'});
        }
        this.forceUpdate();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof AppThemes
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            app,
        } = this.props;

        const {search} = this.state;
        const themeExts = (search ? Exts.themes.search(search) : Exts.themes.all).filter(x => !x.disabled);
        const showDefaultTheme = !search || 'default'.includes(search) || Lang.string('ext.themes.default').includes(search);

        let themesCount = 1;
        const themeViews = themeExts.map(themeExt => {
            return (<div key={themeExt.name} className="app-themes-list list multi-lines with-avatar">
                <div className="heading">
                    <Avatar style={{color: themeExt.accentColor}} auto={themeExt.icon} className="rounded no-margin avatar-sm" />
                    <div className="title"><span>{themeExt.displayName}</span> <small className="text-gray">{themeExt.author ? `@${themeExt.authorName}` : ''}</small></div>
                </div>
                {
                    themeExt.themes.map(theme => {
                        themesCount += 1;
                        const isCurrentTheme = Exts.themes.isCurrentTheme(theme.id);
                        const preview = theme.preview;
                        const themeStyle = Object.assign(Skin.style(theme.color), {
                            backgroundImage: preview ? `url(${preview})` : null
                        });
                        return (<a key={theme.id} className={HTML.classes('item rounded shadow-1', {active: isCurrentTheme})} style={themeStyle} onClick={this.handleThemeClick.bind(this, theme)}>
                            <div className="content">
                                <div className="title">{theme.displayName}{isCurrentTheme && <small className="label circle white text-black shadow-1">{Lang.string('ext.themes.current')}</small>}</div>
                            </div>
                            <Icon name="check active-icon icon-2x text-shadow-white" />
                        </a>);
                    })
                }
            </div>);
        });

        const isCurrentDefault = Exts.themes.isCurrentTheme('default');

        return (<div className={HTML.classes('app-ext-themes dock column single', className)}>
            <header className="app-ext-themes-header app-ext-common-header has-padding heading flex-none divider">
                <div className="title text-gray small">{Lang.format('ext.themes.count.format', themesCount)}</div>
                <div className="search-box">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <nav className="toolbar" />
            </header>
            <div className="app-themes flex-auto scroll-y content-start has-padding">
                {themeViews}
                {showDefaultTheme && <div className="app-themes-list list">
                    <div className="heading">
                        <Avatar style={{color: app.app.accentColor}} auto={app.app.icon} className="rounded no-margin avatar-sm" />
                        <div className="title">{Lang.string('ext.themes.inside')}</div>
                    </div>
                    <a className={HTML.classes('item rounded shadow-1', {active: isCurrentDefault})} style={Skin.style('#3f51b5')} onClick={this.handleThemeClick.bind(this, 'default')}>
                        <div className="content">
                            <div className="title">{Lang.string('ext.themes.default')} {isCurrentDefault && <small className="label circle white text-black shadow-1">{Lang.string('ext.themes.current')}</small>}</div>
                        </div>
                        <Icon name="check active-icon icon-2x text-shadow-white" />
                    </a>
                </div>}
            </div>
        </div>);
    }
}
