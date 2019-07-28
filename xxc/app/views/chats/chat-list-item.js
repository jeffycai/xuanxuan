import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {classes} from '../../utils/html-helper';
import Icon from '../../components/icon';
import Lang, {isJustLangSwitched} from '../../core/lang';
import ROUTES from '../common/routes';
import _ChatAvatar from './chat-avatar';
import App from '../../core';
import withReplaceView from '../with-replace-view';

/**
 * ChatAvatar 可替换组件形式
 * @type {Class<ChatAvatar>}
 * @private
 */
const ChatAvatar = withReplaceView(_ChatAvatar);

/**
 * ChatListItem 组件 ，显示一个聊天列表条目
 * @class ChatListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatListItem from './chat-list-item';
 * <ChatListItem />
 */
export default class ChatListItem extends Component {
    /**
     * ChatListItem 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatListItem
     */
    static replaceViewPath = 'chats/ChatListItem';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatListItem
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        chat: PropTypes.object,
        filterType: PropTypes.string,
        badge: PropTypes.any,
        notUserLink: PropTypes.any,
        subname: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatListItem
     * @static
     */
    static defaultProps = {
        className: null,
        children: null,
        chat: null,
        filterType: null,
        badge: null,
        notUserLink: false,
        subname: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatListItem
     */
    shouldComponentUpdate(nextProps) {
        return (isJustLangSwitched() ||
            this.props.className !== nextProps.className ||
            this.props.children !== nextProps.children ||
            this.props.chat !== nextProps.chat || this.lastChatUpdateId !== nextProps.chat.updateId ||
            (nextProps.chat.isOne2One && nextProps.chat.getTheOtherOne(App).updateId !== this.lastOtherOneUpdateId) ||
            this.props.filterType !== nextProps.filterType ||
            this.props.badge !== nextProps.badge ||
            this.props.notUserLink !== nextProps.notUserLink
        );
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatListItem
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            chat,
            filterType,
            className,
            badge,
            children,
            notUserLink,
            subname,
            ...other
        } = this.props;

        this.lastChatUpdateId = chat.updateId;

        const name = chat.getDisplayName(App);
        if (!subname && subname !== false) {
            if (chat.isOne2One) {
                const theOtherOne = chat.getTheOtherOne(App);
                this.lastOtherOneUpdateId = theOtherOne.updateId;
                if (theOtherOne.isOffline) {
                    subname = `[${Lang.string('member.status.offline')}]`;
                }
            } else if (chat.isSystem) {
                if (chat.isRobot) {
                    const robotSubName = Lang.string('common.littlexxSubname');
                    if (robotSubName !== name) {
                        subname = `(${robotSubName})`;
                    }
                } else {
                    subname = `(${Lang.format('chat.membersCount.format', Lang.string('chat.all'))})`;
                }
            } else if (chat.isGroup) {
                subname = `(${Lang.format('chat.membersCount.format', chat.getMembersCount(App.members))})`;
            }
        }

        if (!badge && badge !== false) {
            const {noticeCount} = chat;
            if (noticeCount) {
                badge = <div className={classes('label circle label-sm', chat.isMuteOrHidden ? 'blue' : 'red')}>{noticeCount > 99 ? '99+' : noticeCount}</div>;
            } else if (chat.mute) {
                badge = <Icon name="bell-off" className="muted" />;
            } else if (chat.star) {
                badge = <Icon name="star" className="icon-sm muted" />;
            }
        }

        if (notUserLink) {
            return (<a
                href={notUserLink === 'disabled' ? null : `#${ROUTES.chats.chat.id(chat.gid, filterType)}`}
                className={classes('app-chat-item flex-middle', className)}
                {...other}
            >
                <ChatAvatar chat={chat} avatarClassName="avatar-sm" avatarSize={24} grayOffline className="flex-none" />
                <div className="title text-ellipsis">
                    {name}
                    {subname && <small className="muted">&nbsp; {subname}</small>}
                </div>
                {badge && <div className="flex-none">{badge}</div>}
                {children}
            </a>);
        }
        return (<Link
            to={ROUTES.chats.chat.id(chat.gid, filterType)}
            className={classes('app-chat-item flex-middle', className)}
            {...other}
        >
            <ChatAvatar chat={chat} avatarClassName="avatar-sm" avatarSize={24} grayOffline className="flex-none" />
            <div className="title text-ellipsis">
                {name}
                {subname && <small className="muted">&nbsp; {subname}</small>}
            </div>
            {badge && <div className="flex-none">{badge}</div>}
            {children}
        </Link>);
    }
}
