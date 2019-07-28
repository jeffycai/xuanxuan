import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Lang from '../../core/lang';
import App from '../../core';
import _MessageList from './message-list';
import _MessageListItem from './message-list-item';
import withReplaceView from '../with-replace-view';

/**
 * MessageListItem 可替换组件形式
 * @type {Class<MessageListItem>}
 * @private
 */
const MessageListItem = withReplaceView(_MessageListItem);

/**
 * MessageList 可替换组件形式
 * @type {Class<MessageList>}
 * @private
 */
const MessageList = withReplaceView(_MessageList);

const MANY_RESULT_COUNT = 200;
const MAX_RESULT_COUNT = 500;

/**
 * ChatSearchResult 组件 ，显示聊天搜索结果界面
 * @class ChatSearchResult
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSearchResult from './chat-search-result';
 * <ChatSearchResult />
 */
export default class ChatSearchResult extends Component {
    /**
     * ChatSearchResult 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSearchResult
     */
    static replaceViewPath = 'chats/ChatSearchResult';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSearchResult
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        chat: PropTypes.object,
        searchKeys: PropTypes.string,
        searchCount: PropTypes.number,
        searchFilterTime: PropTypes.any,
        requestGoto: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSearchResult
     * @static
     */
    static defaultProps = {
        className: null,
        children: null,
        chat: null,
        searchKeys: null,
        requestGoto: null,
        searchCount: 0,
        searchFilterTime: 0,
    };

    /**
     * React 组件构造函数，创建一个 ChatSearchResult 组件实例，会在装配之前被调用。
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
            loading: false,
            errMessage: '',
            messages: [],
            realCount: null,
            selectedMessage: null
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatSearchResult
     * @return {void}
     */
    componentDidMount() {
        this.loadMessages();
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof ChatSearchResult
     * @return {void}
     */
    componentDidUpdate(prevProps, prevState) {
        if (this._createSearchId(this.props) !== this.searchId) {
            this.loadMessages();
        }
        if (this.state.messages && this.state.messages.length && !this.state.selectedMessage) {
            this.handleMessageItemClick(this.state.messages[0]);
        }
    }

    /**
     * 创建搜索标识字符串
     *
     * @param {Object} props 组件属性
     * @return {string} 搜索标识字符串
     * @memberof ChatSearchResult
     * @private
     */
    _createSearchId(props) {
        const {searchKeys, searchFilterTime, chat} = props || this.props;
        return `${chat.gid}|${searchKeys}|${searchFilterTime}`;
    }

    /**
     * 加载消息
     *
     * @memberof ChatSearchResult
     * @private
     * @return {void}
     */
    loadMessages() {
        const {searchKeys, searchFilterTime, searchCount, chat} = this.props;
        const searchId = this._createSearchId(this.props);
        if (searchId !== this.searchId && searchCount) {
            this.searchId = searchId;
            this.contentConvertPattern = new RegExp(`(${searchKeys.split(' ').join('|')})(?![^<]*>)`, 'gi');
            this.setState({
                realCount: null,
                loading: true,
                errMessage: '',
                messages: [],
                selectedMessage: null
            });
            App.im.chats.searchChatMessages(chat, searchKeys, searchFilterTime).then(messages => {
                if (this.searchId === searchId) {
                    const realCount = messages.length;
                    if (realCount > MAX_RESULT_COUNT) {
                        messages.splice(MAX_RESULT_COUNT, realCount - MAX_RESULT_COUNT);
                    }
                    this.setState({
                        realCount,
                        loading: false,
                        errMessage: '',
                        messages,
                    });
                }
            }).catch(error => {
                if (this.searchId === searchId) {
                    this.setState({
                        realCount: 0,
                        loading: false,
                        errMessage: Lang.error(error),
                    });
                }
            });
        }
    }

    /**
     * 高亮替换消息内容
     * @private
     * @memberof ChatHistory
     * @param {string} content 消息内容
     * @return {string} 替换后的内容
     */
    convertContent(content) {
        if (this.contentConvertPattern && this.contentConvertPattern.test(content)) {
            content = content.replace(this.contentConvertPattern, "<span class='highlight'>$1</span>");
        }
        return content;
    }

    /**
     * 处理聊天消息点击事件
     * @param {ChatMessage} message 聊天消息
     * @param {Event} e 事件对象
     * @memberof ChatSearchResult
     * @private
     * @return {void}
     */
    handleMessageItemClick(message, e) {
        this.setState({selectedMessage: message});
        if (this.props.requestGoto) {
            this.props.requestGoto(message);
        }
        if (e) {
            e.stopPropagation();
        }
    }

    /**
     * 消息列表项生成函数
     *
     * @param {ChatMessage} message 聊天消息
     * @param {ChatMessage} lastMessage 上一个聊天消息
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof ChatHistory
     * @private
     */
    listItemCreator(message, lastMessage) {
        return (<MessageListItem
            className={HTML.classes('state state-click-throuth', {active: this.state.selectedMessage && this.state.selectedMessage.gid === message.gid})}
            staticUI
            hideHeader={false}
            showDateDivider={false}
            lastMessage={lastMessage}
            key={message.gid}
            message={message}
            avatarSize={20}
            dateFormater="yyyy-M-d hh:mm"
            textContentConverter={this.convertContent.bind(this)}
            onClick={this.handleMessageItemClick.bind(this, message)}
        />);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSearchResult
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            searchKeys,
            searchFilterTime,
            searchCount,
            className,
            children,
            requestGoto,
            ...other
        } = this.props;

        if (!searchCount) {
            return (<div
                {...other}
                className={HTML.classes('app-chat-search-result column single', className)}
            />);
        }

        return (<div
            {...other}
            className={HTML.classes('app-chat-search-result column single', className)}
            onClick={this.handleMessageItemClick.bind(this, null)}
        >
            <header className="heading flex-none gray">
                <div className="title"><small>{Lang.format('chats.chat.search.result.format', chat.getDisplayName(App), (typeof this.state.realCount) !== 'number' ? searchCount : this.state.realCount)}</small></div>
                {this.state.loading ? <Icon className="loading spin muted" /> : null}
            </header>
            <div className="flex-auto user-selectable scroll-y scroll-x fluid">
                <MessageList
                    className="app-message-list-simple"
                    staticUI
                    messages={this.state.messages}
                    stayBottom={false}
                    listItemCreator={this.listItemCreator.bind(this)}
                />
            </div>
            {!this.state.selectedMessage && <div className="flex-none heading info-pale">
                <Avatar icon="information-outline" />
                <div className="title"><small>{Lang.string('chats.history.search.result.selectTip')}</small></div>
            </div>}
            {this.state.realCount > MANY_RESULT_COUNT && <div className="flex-none heading info-pale">
                <Avatar icon="information-outline" />
                <div className="title"><small>{this.state.realCount > MAX_RESULT_COUNT ? Lang.format('chats.history.search.result.notShow.format', this.state.realCount - MAX_RESULT_COUNT) : ''}{Lang.string('chats.history.search.result.toMany')}</small></div>
            </div>}
            {children}
        </div>);
    }
}
