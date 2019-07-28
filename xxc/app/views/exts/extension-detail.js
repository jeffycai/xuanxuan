import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Skin from '../../utils/skin';
import Avatar from '../../components/avatar';
import Button from '../../components/button';
import Icon from '../../components/icon';
import Spinner from '../../components/spinner';
import Lang from '../../core/lang';
import Exts from '../../exts';
import Markdown from '../../utils/markdown';
import Emojione from '../../components/emojione';
import App from '../../core';

/**
 * ExtensionDetail 组件 ，显示扩展详情界面
 * @class ExtensionDetail
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ExtensionDetail from './extension-detail';
 * <ExtensionDetail />
 */
export default class ExtensionDetail extends Component {
    /**
     * ExtensionDetail 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ExtensionDetail
     */
    static replaceViewPath = 'exts/ExtensionDetail';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ExtensionDetail
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        onRequestClose: PropTypes.func,
        extension: PropTypes.object.isRequired,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ExtensionDetail
     * @static
     */
    static defaultProps = {
        className: null,
        onRequestClose: null,
    };

    /**
     * React 组件构造函数，创建一个 ExtensionDetail 组件实例，会在装配之前被调用。
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
        this.state = {loadingReadme: true};
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ExtensionDetail
     * @return {void}
     */
    componentDidMount() {
        const {extension} = this.props;
        Exts.manager.loadReadmeMarkdown(extension).then(readme => {
            readme = Markdown(readme);
            readme = Emojione.toImage(readme);
            this.readmeContent = readme;
            this.setState({loadingReadme: false});
        }).catch(() => {
            this.setState({loadingReadme: false});
        });

        this.onExtChangeHandler = Exts.all.onExtensionChange(changedExtensions => {
            if (changedExtensions.some(x=> x.name === this.props.extension.name)) {
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
     * @memberof ExtensionDetail
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
    }

    /**
     * 请求关闭父级对话框
     * @private
     * @return {void}
     */
    requestClose() {
        const {onRequestClose} = this.props;
        if (onRequestClose) {
            onRequestClose();
        }
    }

    /**
     * 处理点击卸载按钮事件
     * @param {Extension} extension 要卸载的按钮
     * @memberof ExtensionDetail
     * @private
     * @return {void}
     */
    handleUninstallBtnClick(extension) {
        Exts.ui.uninstallExtension(extension, this.requestClose.bind(this));
    }

    /**
     * 处理点击打开应用扩展按钮事件
     * @param {AppExtension} extension 要打开的按钮
     * @memberof ExtensionDetail
     * @private
     * @return {void}
     */
    handleOpenBtnClick(extension) {
        Exts.ui.openApp(extension.name);
        this.requestClose();
    }

    /**
     * 处理点击启用按钮事件
     * @param {Extension} extension 要启用的按钮
     * @memberof ExtensionDetail
     * @private
     * @return {void}
     */
    handleEnableBtnClick(extension) {
        Exts.manager.setExtensionDisabled(extension, false);
    }

    /**
     * 处理点击禁用按钮事件
     * @param {Extension} extension 要禁用的按钮
     * @memberof ExtensionDetail
     * @private
     * @return {void}
     */
    handleDisableBtnClick(extension) {
        Exts.manager.setExtensionDisabled(extension, true);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ExtensionDetail
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            extension,
            className,
            onRequestClose,
            ...other,
        } = this.props;

        const buttons = [];
        if (extension.isApp && extension.avaliable) {
            buttons.push(<Button onClick={this.handleOpenBtnClick.bind(this, extension)} key="open" icon="open-in-app" className="rounded green-pale outline hover-solid" label={Lang.string('ext.openApp')} />);
        }
        if (!extension.buildIn && !extension.isRemote) {
            if (extension.disabled) {
                buttons.push(<Button onClick={this.handleEnableBtnClick.bind(this, extension)} key="enable" icon="play-protected-content" className="rounded green-pale outline hover-solid" label={Lang.string('ext.enable')} />);
            } else {
                buttons.push(<Button onClick={this.handleDisableBtnClick.bind(this, extension)} key="disable" icon="cancel" className="rounded danger-pale outline hover-solid" label={Lang.string('ext.disable')} />);
            }
        }
        if (!extension.buildIn && !extension.isRemote) {
            buttons.push(<Button onClick={this.handleUninstallBtnClick.bind(this, extension)} key="uninstall" icon="delete" className="rounded danger-pale outline hover-solid" label={Lang.string('ext.uninstall')} />);
        }
        if (extension.homepage) {
            buttons.push(<Button key="homepage" type="a" href={extension.homepage} target="_blank" icon="home" className="rounded gray outline hover-solid" label={Lang.string('ext.homepage')} />);
        }
        if (extension.repository) {
            const repositoryUrl = extension.repository.url || extension.repository;
            const repositoryIcon = repositoryUrl.includes('github.com') ? 'github-circle' : 'source-fork';
            buttons.push(<Button key="repository" type="a" href={repositoryUrl} target="_blank" icon={repositoryIcon} className="rounded gray outline hover-solid" label={Lang.string('ext.repository')} />);
        }
        if (extension.bugs) {
            const bugsUrl = extension.bugs.url || extension.bugs;
            buttons.push(<Button key="bugs" type="a" href={bugsUrl} target="_blank" icon="bug" className="rounded gray outline hover-solid" label={Lang.string('ext.bugs')} />);
        }

        let loadingView = null;
        let sectionView = null;
        if (this.state.loadingReadme) {
            loadingView = <Spinner className="dock dock-bottom" iconClassName="text-white spin inline-block" />;
        } else if (this.readmeContent) {
            sectionView = <section className="has-padding-lg" style={Skin.style({code: extension.accentColor || '#333', textTint: false, pale: true})}><div className="markdown-content" dangerouslySetInnerHTML={{__html: this.readmeContent}} /></section>;
        }

        const titleViews = [<span className="text" key="ext-name">{extension.displayName}</span>];
        if (extension.buildIn) {
            titleViews.push(<span key="ext-buildIn-label" data-hint={Lang.string('ext.buildIn.hint')} className="hint--top hint--md"><Icon name="star-circle text-yellow" /></span>);
        }
        if (extension.isRemote) {
            titleViews.push(<span key="ext-remote-label" data-hint={Lang.string('ext.remote.hint')} className="hint--top hint--md app-ext-list-item-remote-label"> <Icon name="shield-check text-green" /></span>);
        }
        if (extension.needRestart) {
            titleViews.push(<span key="ext-needRestart" className="circle label warning">{Lang.string('ext.extension.needRestart')}</span>);
        }
        titleViews.push(<span key="ext-type" className="muted circle label darken-3 code">#{Lang.string(`ext.type.${extension.type}`)} ∗ {extension.name}</span>);

        const attrViews = [];
        if (extension.version) {
            attrViews.push(<span key="ext-version">v{extension.version}</span>);
        }
        if (extension.author || extension.publisher) {
            let authorView = null;
            if (extension.author && extension.publisher) {
                authorView = `${Lang.string('ext.author')}: ${extension.authorName} · ${Lang.format('ext.publisher.format', extension.publisher)}`;
            } else if (extension.author) {
                authorView = `${Lang.string('ext.author')}: ${extension.authorName}`;
            } else {
                authorView = Lang.format('ext.publisher.format', extension.publisher);
            }
            attrViews.push(<span key="ext-author">{authorView}</span>);
        }
        if (extension.license) {
            attrViews.push(<span key="ext-license">{`${Lang.string('ext.license')}: ${extension.license}`}</span>);
        }

        return (<div className={HTML.classes('app-ext-detail', className)} {...other}>
            <header style={Skin.style({code: extension.accentColor || '#333', textTint: false})}>
                <div className="app-ext-detail-header list-item with-avatar multi-lines relative">
                    <Avatar className="rounded shadow-1 flex-none" auto={extension.icon} skin={{code: extension.accentColor}} />
                    <div className="content">
                        <div className="title space-sm">{titleViews}</div>
                        <div className="space-sm attrs">{attrViews}</div>
                        {extension.description ? <div className="space-sm">{extension.description}</div> : null}
                        <div className="actions">{buttons}</div>
                    </div>
                    {loadingView}
                </div>
            </header>
            {sectionView}
        </div>);
    }
}
