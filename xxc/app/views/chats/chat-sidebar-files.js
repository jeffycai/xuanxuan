import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Lang from '../../core/lang';
import App from '../../core';
import Emojione from '../../components/emojione';
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
 * 渲染加载中动画
 * @return {ReactNode|string|number|null|boolean} React 渲染内容
 * @private
 */
const renderLoading = () => {
    return (<div className="dock center-content" style={{top: HTML.rem(50)}}>
        <Spinner label={Lang.string('chat.sidebar.tab.files.loading')} />
    </div>);
};

/**
 * 渲染文件列表为空的提示界面
 * @return {ReactNode|string|number|null|boolean} React 渲染内容
 * @private
 */
const renderEmptyFileList = () => {
    return (<div className="dock center-content" style={{top: HTML.rem(50)}}>
        <div>
            <div className="text-center" dangerouslySetInnerHTML={{__html: Emojione.toImage(':blowfish:')}} />
            <div className="text-gray small">{Lang.string('chat.sidebar.tab.files.noFilesHere')}</div>
        </div>
    </div>);
};

/**
 * 渲染文件列表
 * @param {FileData[]} files 文件列表
 * @private
 */
const renderFileList = files => {
    return <FileList listItemProps={{smallIcon: true, showSender: true}} className="white rounded" files={files} />;
};

/**
 * ChatSidebarFiles 组件 ，显示聊天侧边栏上的文件列表
 * @class ChatSidebarFiles
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSidebarFiles from './chat-sidebar-files';
 * <ChatSidebarFiles />
 */
export default class ChatSidebarFiles extends Component {
    /**
     * ChatSidebarFiles 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSidebarFiles
     */
    static replaceViewPath = 'chats/ChatSidebarFiles';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSidebarFiles
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSidebarFiles
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatSidebarFiles 组件实例，会在装配之前被调用。
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
            files: [],
            loading: true
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatSidebarFiles
     * @return {void}
     */
    componentDidMount() {
        this.loadFiles();
    }

    /**
     * 加载文件列表
     * @memberof ChatSidebarFiles
     * @return {void}
     */
    loadFiles() {
        const chat = this.props.chat;
        return App.im.chats.getChatFiles(chat).then(files => {
            return this.setState({files, loading: false});
        }).catch(() => {
            return this.setState({files: [], loading: false});
        });
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSidebarFiles
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            chat,
            className,
            children,
            ...other
        } = this.props;

        const {files, loading} = this.state;

        return (<div
            {...other}
            className={HTML.classes('app-chat-sidebar-files has-padding', className)}
        >
            {
                loading ? renderLoading() : files.length ? renderFileList(files) : renderEmptyFileList()
            }
            {children}
        </div>);
    }
}
