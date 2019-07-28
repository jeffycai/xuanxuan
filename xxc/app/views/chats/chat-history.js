import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import DateHelper from '../../utils/date-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Pager from '../../components/pager';
import Lang from '../../core/lang';
import App from '../../core';
import ChatMessage from '../../core/models/chat-message';
import _ChatTitle from './chat-title';
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

/**
 * ChatTitle 可替换组件形式
 * @type {Class<ChatTitle>}
 * @private
 */
const ChatTitle = withReplaceView(_ChatTitle);

/**
 * ChatHistory 组件 ，显示一个查看聊天记录界面
 * @class ChatHistory
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatHistory from './chat-history';
 * <ChatHistory />
 */
export default class ChatHistory extends Component {
    /**
     * ChatHistory 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatHistory
     */
    static replaceViewPath = 'chats/ChatHistory';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatHistory
     * @type {Object}
     */
    static propTypes = {
        chat: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
        gotoMessage: PropTypes.object,
        searchKeys: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatHistory
     * @static
     */
    static defaultProps = {
        chat: null,
        className: null,
        children: null,
        gotoMessage: null,
        searchKeys: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatHistory 组件实例，会在装配之前被调用。
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
            pager: {
                page: 1,
                recTotal: 0,
                recPerPage: 50,
                pageRecCount: 0
            },
            message: '',
            loading: true,
            messages: []
        };

        /**
         * 页码标记
         * @type {Map}
         * @private
         */
        this.pageMark = {};

        /**
         * 高亮内容替换正则表达式
         * @type {Regex}
         * @private
         */
        this.contentConvertPattern = null;
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatHistory
     * @return {void}
     */
    componentDidMount() {
        this.chatHistoryHandler = App.im.server.onChatHistory((pager) => {
            if (pager.gid === this.props.chat.gid) {
                this.setState({message: `${Lang.string('chats.history.fetchingMessages')} ${Math.min(pager.recTotal, pager.pageID * pager.recPerPage)}/${pager.recTotal}`});
                if (pager.isFetchOver) {
                    const thisPager = this.state.pager;
                    thisPager.recTotal = pager.recTotal;
                    thisPager.page = Math.ceil(thisPager.recTotal / thisPager.recPerPage);
                    this.setState({pager: thisPager, message: `${Lang.string('chats.history.fetchingMessages')} ${Lang.string('chats.history.fetchFinish')}`});
                    this.fetchOverTaskTimer = setTimeout(() => {
                        this.loadMessages();
                        this.setState({message: ''});
                    }, 200);
                }
            }
        });
        this.loadFirstPage();
    }

    /**
     * React 组件生命周期函数：`componentWillUpdate`
     * 当接收到新属性或状态时，UNSAFE_componentWillUpdate()为在渲染前被立即调用。
     *
     * @param {Object} nextProps 即将更新的属性值",
     * @param {Object} nextState 即将更新的状态值",
     * @see https://doc.react-china.org/docs/react-component.html#componentWillUpdate
     * @private
     * @memberof ChatHistory
     * @return {void}
     * @todo 考虑使用 `UNSAFE_componentWillUpdate` 替换 `componentWillUpdate`
     */
    componentWillUpdate(nextProps, nextState) {
        if (nextProps.searchKeys !== this.props.searchKeys) {
            if (nextProps.searchKeys) {
                this.contentConvertPattern = new RegExp(`(${nextProps.searchKeys.split(' ').join('|')})(?![^<]*>)`, 'gi');
            } else {
                this.contentConvertPattern = null;
            }
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
     * @memberof ChatHistory
     * @return {void}
     */
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.chat.gid !== this.props.chat.gid) {
            this.loadFirstPage();
        } else if (this.props.gotoMessage) {
            const {gotoMessage} = this.props;
            if (gotoMessage) {
                const gotoId = `${gotoMessage.time}@${gotoMessage.gid}`;
                if (gotoId !== this.gotoId) {
                    this.loadMessages();
                }
            }
        }
        if (this.activeMessageId) {
            const activeMessageEle = document.getElementById(this.activeMessageId);
            if (activeMessageEle) {
                activeMessageEle.scrollIntoView({block: 'center', behavior: 'smooth'});
                activeMessageEle.classList.add('highlight-focus');
            }
            this.activeMessageId = null;
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatHistory
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.chatHistoryHandler);
        clearTimeout(this.fetchOverTaskTimer);
    }

    /**
     * 根据分页设置查找消息具体所在的页面
     *
     * @param {Chat} chat 聊天实例
     * @param {ChatMessage} gotoMessage 要查找的消息
     * @param {{recTotal: number, recPerPage: number}} pager 分页设置
     * @returns {Promise<{recTotal: number, recPerPage: number, page: number}>} 使用 Promise 异步返回处理结果
     * @memberof ChatHistory
     * @private
     */
    findPageMark(chat, gotoMessage, pager) {
        const totalPage = Math.ceil(pager.recTotal / pager.recPerPage);
        if (totalPage < 2) {
            this.pageMark[gotoMessage.gid] = {page: pager.page};
            return Promise.resolve(pager);
        }
        return App.im.chats.getChatMessages(chat, msg => !!msg.id && msg.id <= gotoMessage.id, 0, 0, false, true, false, true).then(result => {
            pager.page = Math.ceil(result.count / pager.recPerPage);
            this.pageMark[gotoMessage.gid] = {page: pager.page};
            return Promise.resolve(pager);
        });
    }

    /**
     * 从数据库获取历史消息
     *
     * @param {function} callback 回调函数
     * @memberof ChatHistory
     * @return {void}
     * @private
     */
    loadMessages(callback) {
        let {pager} = this.state;
        const {chat, gotoMessage} = this.props;
        this.setState({loading: true});

        if (gotoMessage) {
            const gotoId = `${gotoMessage.time}@${gotoMessage.gid}`;
            if (this.gotoId !== gotoId) {
                this.gotoId = gotoId;
                const mark = this.pageMark[gotoMessage.gid];
                if (mark) {
                    if (mark.page !== pager.page) {
                        pager.page = mark.page;
                        this.setState(pager);
                    }
                } else {
                    return this.findPageMark(chat, gotoMessage, pager).then((newPager) => {
                        pager = Object.assign(pager, newPager);
                        this.setState(pager);
                        this.loadMessages();
                    }).catch(error => {
                        this.setState({pager, loading: false, messages: [], message: error && Lang.error(error)});
                        if (callback) {
                            callback(false);
                        }
                    });
                }
            }
        }

        const pageDataID = `${chat.gid}/${pager.page}`;
        if (pageDataID === this.pageDataID) {
            this.setState({loading: false});
            if (callback) {
                callback(true);
            }
            return;
        }

        App.im.chats.getChatMessages(chat, msg => !!msg.id, pager.recPerPage, pager.recPerPage * (pager.page - 1), false).then(messages => {
            messages = ChatMessage.sort(messages);
            pager.pageRecCount = messages.length;
            this.setState({
                pager,
                loading: false,
                messages,
            });
            this.pageDataID = pageDataID;
            if (callback) {
                callback(messages);
            }
        }).catch(error => {
            this.setState({pager, loading: false, messages: [], message: error && Lang.error(error)});
            if (callback) {
                callback(false);
            }
        });
    }

    /**
     * 从数据库查找历史消息
     *
     * @param {function} callback 回调函数
     * @memberof ChatHistory
     * @return {void}
     * @private
     */
    findMessages(callback) {
        this.setState({loading: true});
        const {pager} = this.state;
        const {chat} = this.props;
        App.im.chats.countChatMessages(chat.gid, msg => !!msg.id).then(count => {
            if (count) {
                pager.page = Math.ceil(count / pager.recPerPage);
                pager.recTotal = count;
                this.setState({pager});
                this.loadMessages(callback);
            } else {
                this.setState({loading: false, messages: [], message: Lang.string('chats.history.noMessages')});
                if (callback) {
                    callback(false);
                }
            }
        }).catch(error => {
            this.setState({loading: false, messages: [], message: error && Lang.error(error)});
            if (callback) {
                callback(false);
            }
        });
    }

    /**
     * 处理页码变更事件
     * @param {number} page 页码
     * @memberof ChatHistory
     * @private
     * @return {void}
     */
    handleOnPageChange = (page) => {
        if (!this.state.loading) {
            const {pager} = this.state;
            pager.page = page;
            this.setState({pager});
            this.loadMessages();
        }
    }

    /**
     * 处理点击拉去历史记录消息按钮事件
     * @param {Event} e 事件对象
     * @memberof ChatHistory
     * @private
     * @return {void}
     */
    handleFecthBtnClick = e => {
        const chat = this.props.chat;
        if (chat.id) {
            this.setState({loading: true, message: Lang.string('chats.history.fetchingMessages')});
            App.im.server.fetchChatsHistory(this.props.chat.gid);
        } else {
            this.setState({loading: false, message: Lang.string('chats.history.localChat'), messages: []});
        }
    }

    /**
     * 加载首页历史消息
     *
     * @memberof ChatHistory
     * @return {void}
     * @private
     */
    loadFirstPage() {
        this.setState({
            pager: {
                page: 1,
                recTotal: 0,
                recPerPage: 50,
                pageRecCount: 0
            },
            message: '',
            loading: true,
            messages: []
        });
        this.findMessages(messages => {
            if (!messages || !messages.length) {
                this.handleFecthBtnClick();
            }
        });
    }

    /**
     * 高亮替换消息内容
     * @private
     * @memberof ChatHistory
     * @param {string} content 消息内容
     * @return {string} 替换后的内容
     */
    convertContent = content => {
        if (this.props.searchKeys && this.contentConvertPattern && this.contentConvertPattern.test(content)) {
            content = content.replace(this.contentConvertPattern, "<span class='highlight'>$1</span>");
        }
        return content;
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
        const active = this.props.searchKeys && this.props.gotoMessage && this.props.gotoMessage.gid === message.gid;
        if (active) {
            this.activeMessageId = `app-chat-history-message_${message.gid}`;
        }
        return (<MessageListItem
            id={active ? this.activeMessageId : null}
            className={HTML.classes({active})}
            staticUI={true}
            lastMessage={lastMessage}
            key={message.gid}
            message={message}
            sleepUrlCard={true}
            textContentConverter={this.convertContent}
        />);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatHistory
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            gotoMessage,
            searchKeys,
            ...other
        } = this.props;

        const messages = this.state.messages;

        return (<div
            {...other}
            className={HTML.classes('app-chat-history column single', className)}
        >
            <ChatTitle className="flex-none gray has-padding-h" chat={chat}>
                {(messages && messages.length) ? <div className="small">{DateHelper.formatSpan(messages[0].date, messages[messages.length - 1].date, {full: Lang.string('time.format.full'), month: Lang.string('time.format.month'), day: Lang.string('time.format.day')})}</div> : null}
                <nav className="toolbar flex flex-middle">
                    <Pager {...this.state.pager} onPageChange={this.handleOnPageChange} />
                    <div data-hint={Lang.string('chats.history.fetchFromServer')} className="hint--bottom-left"><button onClick={this.handleFecthBtnClick} type="button" disabled={this.state.loading || !chat.id || App.im.server.isFetchingHistory()} className="iconbutton btn rounded"><Icon name="cloud-download icon-2x" /></button></div>
                </nav>
            </ChatTitle>
            {this.state.message && <div className="heading blue flex-none">
                <Avatar icon={this.state.loading ? 'loading spin' : 'information'} />
                <div className="title">{this.state.message}</div>
            </div>}
            <div className="flex-auto user-selectable scroll-y scroll-x fluid">
                <MessageList stayBottom={!gotoMessage} staticUI messages={messages} listItemCreator={this.listItemCreator.bind(this)} />
            </div>
            {children}
        </div>);
    }
}
