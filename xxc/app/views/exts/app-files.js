import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Lang from '../../core/lang';
import SearchControl from '../../components/search-control';
import OpenedApp from '../../exts/opened-app';
import App from '../../core';
import Spinner from '../../components/spinner';
import _FileList from '../common/file-list';
import withReplaceView from '../with-replace-view';

/**
 * FileList 可替换组件形式
 * @type {Class<FileList>}
 * @private
 */
const FileList = withReplaceView(_FileList);

/**
 * 最大显示的文件数目
 * @type {number}
 * @private
 */
const MAX_SHOW_FILES_COUNT = 200;

/**
 * AppFiles 组件 ，显示“文件”应用界面
 * @class AppFiles
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import AppFiles from './app-files';
 * <AppFiles />
 */
export default class AppFiles extends PureComponent {
    /**
     * AppFiles 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof AppFiles
     */
    static replaceViewPath = 'exts/AppFiles';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof AppFiles
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
     * @memberof AppFiles
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 AppFiles 组件实例，会在装配之前被调用。
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
            files: [],
            loading: false,
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
     * @memberof AppFiles
     * @return {void}
     */
    componentDidMount() {
        this.loadFiles();
        this.onUserLoginHandler = App.server.onUserLogin(() => {
            this.loadFiles();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof AppFiles
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onUserLoginHandler);
    }

    /**
     * 处理点击导航项目事件
     * @param {string} extType 导航类型名称
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleNavItemClick(fileType) {
        this.props.app.params = {type: fileType.type};
        this.loadFiles(null, fileType.type);
    }

    /**
     * 处理搜索文本变更事件
     * @param {string} search 搜索文本
     * @memberof AppExtensions
     * @private
     * @return {void}
     */
    handleSearchChange = search => {
        this.loadFiles(search);
    };

    /**
     * 加载文件列表
     * @param {string} [search=null] 搜索字符串
     * @param {string} [type=null] 搜索文件类型值
     * @return {void}
     */
    loadFiles(search = null, type = null) {
        if (this.state.loading) {
            // App.ui.showMessger(Lang.string('common.waiting'));
            return;
        }
        const state = {search: this.state.search, type: this.state.type};
        if (search !== null) {
            state.search = search;
        }
        if (type !== null) {
            state.type = type;
        }
        const searchId = `${this.state.search} :${this.state.type}`;
        if (!App.profile.isUserVertified) {
            return this.setState({files: [], loading: false});
        }
        if (this.searchId !== searchId) {
            state.loading = true;
            state.files = [];
            this.setState(state, () => {
                App.im.files.search(state.search, state.type).then(files => {
                    this.setState({files, loading: false});
                }).catch(error => {
                    if (error) {
                        App.ui.showMessger(Lang.string(error), {type: 'danger'});
                        if (DEBUG) {
                            console.error('load files error', error);
                        }
                    }
                    this.setState({files: [], loading: false});
                });
            });
        } else {
            this.setState(state);
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof AppFiles
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            app,
        } = this.props;

        const {loading, type} = this.state;
        const filesCount = this.state.files ? this.state.files.length : 0;
        let showFiles = filesCount ? this.state.files : [];
        if (showFiles.length > MAX_SHOW_FILES_COUNT) {
            showFiles = showFiles.slice(0, MAX_SHOW_FILES_COUNT);
        }

        /**
         * 文件类型清单
         * @type {{type: string, label: string}[]}
         * @private
         */
        const fileTypes = [
            {type: '', label: Lang.string('ext.files.all')},
            {type: 'doc', label: Lang.string('ext.files.docs')},
            {type: 'image', label: Lang.string('ext.files.images')},
            {type: 'program', label: Lang.string('ext.files.programs')},
            {type: 'other', label: Lang.string('ext.files.others')},
        ];

        return (<div className={HTML.classes('app-ext-files dock single column', className)}>
            <header className="app-ext-files-header app-ext-common-header has-padding heading divider flex-none">
                <nav className="nav">
                    {
                        fileTypes.map(fileType => {
                            return <a key={fileType.type} onClick={this.handleNavItemClick.bind(this, fileType)} className={fileType.type === type ? 'active' : ''}>{fileType.label}</a>;
                        })
                    }
                </nav>
                <div className="search-box flex-none">
                    <SearchControl onSearchChange={this.handleSearchChange} changeDelay={1000} />
                </div>
            </header>
            <div className="flex-auto content-start scroll-y">
                {filesCount ? <div className="heading gray">
                    <div className="title strong muted small">{Lang.format('ext.files.findCount.format', filesCount)}</div>
                </div> : null}
                <FileList listItemProps={{showDate: true, showSender: true}} files={showFiles} className="app-ext-files-list multi-lines with-avatar" />
                {showFiles.length < filesCount && <div className="heading divider-top"><small className="title muted">{Lang.format('ext.files.findToMany.format', filesCount, showFiles.length, filesCount - showFiles.length)}</small></div>}
                {loading && <Spinner className="has-padding-lg" label={Lang.string('common.loading')} />}
            </div>
        </div>);
    }
}
