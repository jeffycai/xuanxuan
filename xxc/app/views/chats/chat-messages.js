import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import _MessageList from './message-list';
import Spinner from '../../components/spinner';
import Lang, {isJustLangSwitched} from '../../core/lang';
import withReplaceView from '../with-replace-view';

/**
 * MessageList 可替换组件形式
 * @type {Class<MessageList>}
 * @private
 */
const MessageList = withReplaceView(_MessageList);

/**
 * ChatMessages 组件 ，显示一个聊天消息列表界面
 * @class ChatMessages
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatMessages from './chat-messages';
 * <ChatMessages />
 */
export default class ChatMessages extends Component {
    /**
     * ChatMessages 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatMessages
     */
    static replaceViewPath = 'chats/ChatMessages';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatMessages
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatMessages
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatMessages 组件实例，会在装配之前被调用。
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
            loading: !props.chat.isLoadingOver
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatMessages
     * @return {void}
     */
    componentDidMount() {
        this.loadChatMessages(400);
    }

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatMessages
     */
    shouldComponentUpdate(nextProps, nextState) {
        return isJustLangSwitched() || nextState.loading !== this.state.loading || this.props.className !== nextProps.className || this.props.chat !== nextProps.chat || this.lastChatUpdateId !== nextProps.updateId;
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof ChatMessages
     * @return {void}
     */
    componentDidUpdate() {
        if (!this.props.chat.isFirstLoaded) {
            this.loadChatMessages();
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatMessages
     * @return {void}
     */
    componentWillUnmount() {
        if (this.loadChatMessagesTask) {
            clearTimeout(this.loadChatMessagesTask);
        }
    }

    /**
     * 加载聊天消息
     *
     * @param {number} [delay=0] 延迟时间，单位毫秒
     * @memberof ChatMessages
     * @private
     * @return {void}
     */
    loadChatMessages(delay = 0) {
        const {chat} = this.props;
        if (!chat.isLoadingOver && !this.loadChatMessagesTask) {
            this.loadChatMessagesTask = setTimeout(() => {
                this.setState({loading: true}, () => {
                    App.im.chats.loadChatMessages(chat)
                        .then(() => this.setState({loading: false}))
                        .catch(() => this.setState({loading: false}));
                    this.loadChatMessagesTask = null;
                });
            }, delay);
        }
    }

    /**
     * 处理滚动事件
     * @param {Object} scrollInfo 滚动信息
     * @memberof ChatMessages
     * @private
     * @return {void}
     */
    handleScroll = scrollInfo => {
        if (scrollInfo.isAtTop) {
            this.loadChatMessages();
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatMessages
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            ...other
        } = this.props;

        const font = App.profile.userConfig.chatFontSize;
        this.lastChatUpdateId = chat.updateId;

        let headerView = null;
        if (this.state.loading) {
            headerView = <Spinner className="has-padding" />;
        } else if (chat.messages && chat.isLoadingOver) {
            const noMoreMessageText = Lang.string('chat.noMoreMessage');
            if (noMoreMessageText) {
                headerView = <div className="has-padding small muted text-center space-sm">― {noMoreMessageText} ―</div>;
            }
        } else {
            headerView = <a className="has-padding small muted text-center block space-sm" onClick={this.loadChatMessages.bind(this, 0)}>― {Lang.string('chat.loadMoreMessage')} ―</a>;
        }

        return (<div
            className={classes('app-chat-messages white', className)}
            {...other}
        >
            <MessageList header={headerView} font={font} className="dock scroll-y user-selectable" messages={chat.messages} onScroll={chat.isLoadingOver ? null : this.handleScroll} />
        </div>);
    }
}
