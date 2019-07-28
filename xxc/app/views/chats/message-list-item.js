import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {formatDate, isSameDay, isToday} from '../../utils/date-helper';
import App from '../../core';
import Lang, {isJustLangSwitched} from '../../core/lang';
import Icon from '../../components/icon';
import MemberProfileDialog from '../common/member-profile-dialog';
import _UserAvatar from '../common/user-avatar';
import _MessageDivider from './message-divider';
import _MessageContentFile from './message-content-file';
import _MessageContentImage from './message-content-image';
import _MessageContentText from './message-content-text';
import _MessageBroadcast from './message-broadcast';
import _NotificationMessage from './notification-message';
import _MessageContentUrl from './message-content-url';
import ChatMessage from '../../core/models/chat-message';
import {showContextMenu} from '../../core/context-menu';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * MessageDivider 可替换组件形式
 * @type {Class<MessageDivider>}
 * @private
 */
const MessageDivider = withReplaceView(_MessageDivider);

/**
 * MessageContentUrl 可替换组件形式
 * @type {Class<MessageContentUrl>}
 * @private
 */
const MessageContentUrl = withReplaceView(_MessageContentUrl);

/**
 * MessageContentText 可替换组件形式
 * @type {Class<MessageContentText>}
 * @private
 */
const MessageContentText = withReplaceView(_MessageContentText);

/**
 * MessageContentImage 可替换组件形式
 * @type {Class<MessageContentImage>}
 * @private
 */
const MessageContentImage = withReplaceView(_MessageContentImage);

/**
 * NotificationMessage 可替换组件形式
 * @type {Class<NotificationMessage>}
 * @private
 */
const NotificationMessage = withReplaceView(_NotificationMessage);

/**
 * MessageContentFile 可替换组件形式
 * @type {Class<MessageContentFile>}
 * @private
 */
const MessageContentFile = withReplaceView(_MessageContentFile);

/**
 * MessageBroadcast 可替换组件形式
 * @type {Class<MessageBroadcast>}
 * @private
 */
const MessageBroadcast = withReplaceView(_MessageBroadcast);

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * 连续的聊天消息显示时间标签最小时间间隔，单位毫秒
 * @type {number}
 * @private
 */
const showTimeLabelInterval = 1000 * 60 * 5;

/**
 * MessageListItem 组件 ，显示聊天列表条目界面
 * @class MessageListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MessageListItem from './message-list-item';
 * <MessageListItem />
 */
export default class MessageListItem extends Component {
    /**
     * MessageListItem 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageListItem
     */
    static replaceViewPath = 'chats/MessageListItem';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageListItem
     * @type {Object}
     */
    static propTypes = {
        message: PropTypes.object.isRequired,
        lastMessage: PropTypes.object,
        font: PropTypes.object,
        ignoreStatus: PropTypes.bool,
        showDateDivider: PropTypes.any,
        hideHeader: PropTypes.any,
        staticUI: PropTypes.bool,
        avatarSize: PropTypes.number,
        dateFormater: PropTypes.string,
        textContentConverter: PropTypes.func,
        className: PropTypes.string,
        children: PropTypes.any,
        sleepUrlCard: PropTypes.bool,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageListItem
     * @static
     */
    static defaultProps = {
        lastMessage: null,
        children: null,
        font: null,
        className: null,
        showDateDivider: 0,
        hideHeader: 0,
        staticUI: false,
        avatarSize: null,
        dateFormater: 'hh:mm',
        ignoreStatus: false,
        textContentConverter: null,
        sleepUrlCard: null,
    };

    /**
     * React 组件构造函数，创建一个 MessageListItem 组件实例，会在装配之前被调用。
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
        this.state = {sharing: false};
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MessageListItem
     * @return {void}
     */
    componentDidMount() {
        const {ignoreStatus} = this.props;
        if (!ignoreStatus) {
            this.checkResendMessage();
        }
        if (this.needGetSendInfo && this.needGetSendInfo !== true) {
            App.server.tryGetTempUserInfo(this.needGetSendInfo);
            this.needGetSendInfo = true;
        }
    }

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof MessageListItem
     */
    shouldComponentUpdate(nextProps, nextState) {
        return (isJustLangSwitched() ||
            this.state.sharing !== nextState.sharing ||
            this.props.message !== nextProps.message || nextProps.message.updateId !== this.lastMessageUpdateId ||
            this.props.lastMessage !== nextProps.lastMessage ||
            this.props.showDateDivider !== nextProps.showDateDivider ||
            this.props.hideHeader !== nextProps.hideHeader ||
            this.props.ignoreStatus !== nextProps.ignoreStatus ||
            this.props.font !== nextProps.font || (this.props.font && nextProps.font && this.lastFontSize !== nextProps.font.size) ||
            this.props.className !== nextProps.className ||
            this.props.dateFormater !== nextProps.dateFormater ||
            this.props.textContentConverter !== nextProps.textContentConverter ||
            this.props.avatarSize !== nextProps.avatarSize ||
            this.props.children !== nextProps.children ||
            (this.lastSenderUpdateId !== false && this.lastSenderUpdateId !== nextProps.message.getSender(App.members).updateId) ||
            this.props.staticUI !== nextProps.staticUI);
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof MessageListItem
     * @return {void}
     */
    componentDidUpdate() {
        const {ignoreStatus} = this.props;
        if (!ignoreStatus) {
            this.checkResendMessage();
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof MessageListItem
     * @return {void}
     */
    componentWillUnmount() {
        clearTimeout(this.checkResendTask);
    }

    /**
     * 处理点击发送者名称事件
     * @param {Member} sender 发送者
     * @param {ChatMessage} message 聊天消息
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleSenderNameClick(sender, message) {
        App.im.ui.sendContentToChat(`@${sender.displayName} `);
    }

    /**
     * 处理显示用户右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleUserContextMenu = event => {
        const {message} = this.props;
        const sender = message.getSender(App.members);
        showContextMenu('chat.member', {event, member: sender, chat: App.im.chats.get(message.cgid)});
    }

    /**
     * 检查是否需要重新发送消息
     * @memberof MessageListItem
     * @return {void}
     */
    checkResendMessage() {
        const {message} = this.props;
        if (message.needCheckResend) {
            clearTimeout(this.checkResendTask);
            this.checkResendTask = setTimeout(() => {
                if (message.needResend) {
                    this.forceUpdate();
                }
            }, 10500);
        }
    }

    /**
     * 处理重新发送按钮点击事件
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleResendBtnClick = () => {
        const {message} = this.props;
        message.date = new Date().getTime();
        if (message.needCheckResend) {
            App.im.server.sendChatMessage(message);
        }
        this.forceUpdate();
    };

    /**
     * 处理删除按钮点击事件
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleDeleteBtnClick = () => {
        const {message} = this.props;
        if (message.needCheckResend) {
            App.im.chats.deleteLocalMessage(message);
        }
    };

    /**
     * 处理分享按钮点击事件
     * @param {Event} event 事件对象
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleShareBtnClick = event => {
        const {message} = this.props;
        if (showContextMenu(this.isFileContent ? 'message.file' : this.isImageContent ? 'message.image' : 'message.text', {
            event,
            message,
            options: {
                onHidden: () => {
                    this.setState({sharing: false});
                }
            }
        })) {
            this.setState({sharing: true});
        }
    };

    /**
     * 处理显示消息内容上下文菜单事件
     * @param {Event} event 事件对象
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleContentContextMenu = event => {
        if (event.target.tagName === 'WEBVIEW') {
            return;
        }

        const {message} = this.props;
        if (showContextMenu(this.isUrlContent ? 'link' : 'message.text', {
            event,
            message,
            options: {
                copy: !this.isUrlContent,
                selectAll: true,
                linkTarget: true,
                onHidden: () => {
                    this.setState({sharing: false});
                }
            }
        })) {
            this.setState({sharing: true});
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageListItem
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            message,
            lastMessage,
            showDateDivider,
            hideHeader,
            ignoreStatus,
            font,
            className,
            dateFormater,
            textContentConverter,
            avatarSize,
            children,
            staticUI,
            sleepUrlCard,
            ...other
        } = this.props;

        this.lastMessageUpdateId = message.updateId;
        this.lastFontSize = font && font.size;

        const basicFontStyle = font ? {
            fontSize: `${font.size}px`,
            lineHeight: font.lineHeight,
        } : null;
        if (showDateDivider === 0) {
            showDateDivider = !lastMessage || !isSameDay(message.date, lastMessage.date);
        }

        if (message.isBroadcast) {
            return (
                <div className={classes('app-message-item app-message-item-broadcast', className)} {...other}>
                    {showDateDivider && <MessageDivider date={message.date} />}
                    <MessageBroadcast contentConverter={textContentConverter} style={basicFontStyle} message={message} />
                </div>
            );
        }

        const needCheckResend = !ignoreStatus && message.needCheckResend;
        const needResend = !ignoreStatus && needCheckResend && message.needResend;
        const isNotification = message.isNotification;

        if (hideHeader === 0) {
            hideHeader = !showDateDivider && lastMessage && lastMessage.senderId === message.senderId && lastMessage.type === message.type;
        }

        let headerView = null;
        let timeLabelView = null;
        let contentView = null;
        let resendButtonsView = null;
        this.isTextContent = false;
        this.isUrlContent = false;

        const titleFontStyle = font ? {
            fontSize: `${font.title}px`,
            lineHeight: font.titleLineHeight,
        } : null;

        const hideChatAvatar = Config.ui['chat.hideChatAvatar'];
        const mentionOthers = Config.ui['chat.mentionOthers'];
        const isSendByMe = message.isSender(App.profile.userId);

        if (!hideHeader) {
            const sender = message.getSender(App.members);
            this.lastSenderUpdateId = sender.updateId;
            if (sender.temp) {
                this.needGetSendInfo = sender.id;
            }
            const avatarView = hideChatAvatar ? null : <UserAvatar size={avatarSize} className="state" user={sender} onContextMenu={this.handleUserContextMenu} onClick={isNotification ? null : MemberProfileDialog.show.bind(null, sender, null)} />;
            const senderName = (isSendByMe && Config.ui['chat.showMeAsMySenderName']) ? Lang.string('chat.message.senderMe') : sender.displayName;
            headerView = (
                <div className="app-message-item-header">
                    {avatarView}
                    <header style={titleFontStyle}>
                        {(isNotification || !mentionOthers) ? <span className="title text-primary">{senderName}</span> : (
                            <a
                                className="title rounded text-primary"
                                onContextMenu={staticUI ? null : this.handleUserContextMenu}
                                onClick={staticUI ? MemberProfileDialog.show.bind(null, sender, null) : this.handleSenderNameClick.bind(this, sender, message)}
                            >
                                {senderName}
                            </a>
                        )}
                        <small className="time">{formatDate(message.date, dateFormater)}</small>
                    </header>
                </div>
            );
        } else {
            this.lastSenderUpdateId = false;
        }

        if (isNotification) {
            contentView = <NotificationMessage message={message} />;
        } else if (message.isFileContent) {
            contentView = <MessageContentFile message={message} />;
            this.isFileContent = true;
        } else if (message.isImageContent) {
            contentView = <MessageContentImage message={message} />;
            this.isImageContent = true;
        } else if (message.isObjectContent) {
            const {objectContent} = message;
            if (objectContent && objectContent.type === ChatMessage.OBJECT_TYPES.url && objectContent.url) {
                const sleep = sleepUrlCard === null ? !isToday(message.date) : sleepUrlCard;
                contentView = <MessageContentUrl url={objectContent.url} data={objectContent} sleep={sleep} cgid={message.cgid} message={message} />;
                this.isUrlContent = true;
            } else {
                contentView = <div className="box red-pale">[Unknown Object]</div>;
            }
        } else {
            contentView = <MessageContentText id={`message-content-${message.gid}`} contentConverter={textContentConverter} fontSize={this.lastFontSize} style={basicFontStyle} message={message} />;
            this.isTextContent = true;
        }

        if (!hideChatAvatar && !headerView) {
            let hideTimeLabel = false;
            if (hideHeader && !showDateDivider && lastMessage && message.date && (message.date - lastMessage.date) <= showTimeLabelInterval) {
                hideTimeLabel = true;
            }
            timeLabelView = <span className={classes('app-message-item-time-label', {'as-dot': hideTimeLabel})}>{formatDate(message.date, 'hh:mm')}</span>;
        }

        if (!staticUI && !ignoreStatus && needResend) {
            resendButtonsView = (
                <nav className="nav nav-sm app-message-item-actions">
                    <a onClick={this.handleResendBtnClick}><Icon name="refresh" /> {Lang.string('chat.message.resend')}</a>
                    <a onClick={this.handleDeleteBtnClick}><Icon name="delete" /> {Lang.string('common.delete')}</a>
                </nav>
            );
        }

        let actionsView = null;
        if (this.isTextContent || this.isImageContent || this.isFileContent) {
            actionsView = (
                <div className="actions">
                    <div className="hint--top-left"><button className="btn btn-sm iconbutton rounded" type="button" onClick={this.handleShareBtnClick}><Icon name="dots-vertical" /></button></div>
                </div>
            );
        }

        return (
            <div
                {...other}
                className={classes('app-message-item', className, {
                    'app-message-sending': !ignoreStatus && needCheckResend && !needResend,
                    'app-message-send-fail': !ignoreStatus && needResend,
                    'app-message-send-by-me': isSendByMe,
                    'with-avatar': !hideHeader,
                    'hide-chat-avatar': hideChatAvatar,
                    sharing: this.state.sharing
                })}
            >
                {showDateDivider && <MessageDivider date={message.date} />}
                {headerView}
                {timeLabelView}
                {contentView && <div className={classes(`app-message-content content-type-${message.contentType}`, {'content-type-text': message.isPlainTextContent})} onContextMenu={(this.isTextContent) ? this.handleContentContextMenu : null}>{contentView}{actionsView}</div>}
                {resendButtonsView}
            </div>
        );
    }
}
